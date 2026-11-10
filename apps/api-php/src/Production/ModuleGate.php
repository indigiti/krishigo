<?php
declare(strict_types=1);
namespace KrishiGo\Production;

/**
 * M28 production feature policy. This is independent of the browser-local and
 * protected-JSON staging registry. Every relevant PHP route checks this table
 * server-side; missing or partial policy fails CLOSED.
 */
final class ModuleGate {
    private const DEPENDENCIES = [3=>[2],10=>[9],16=>[7],20=>[1],24=>[2]];
    private const DOMAIN_MODULES = ['mandi'=>1,'weather'=>6,'schemes'=>8,'inputs'=>11,'logistics'=>12];
    public static function routeModule(string $path):?int {
        $prefixes=[
            '/api/v1/marketplace/listings'=>2,
            '/api/v1/enquiries'=>2,
            '/api/v1/trade'=>2,
            '/api/v1/buyers/requirements'=>3,
            '/api/v1/community/posts'=>4,
            '/api/v1/knowledge'=>7,
            '/api/v1/editor/knowledge'=>7,
            '/api/v1/suppliers'=>15,
            '/api/v1/admin/suppliers'=>15,
            '/api/v1/plant-cases'=>21,
            '/api/v1/agronomy'=>21,
            '/api/v1/me/fields'=>21,
            '/api/v1/me/farm-profile'=>21,
            '/api/v1/assistant'=>18,
        ];
        foreach($prefixes as $prefix=>$id)
            if($path===$prefix || str_starts_with($path,$prefix.'/'))return $id;
        if($path==='/api/v1/data/snapshots') {
            $domain=$_GET['domain']??'';
            return is_string($domain) ? (self::DOMAIN_MODULES[$domain]??null) : null;
        }
        if(preg_match('~^/api/v1/admin/review-cases/(listing|requirement|post)/~D',$path,$m))
            return ['listing'=>2,'requirement'=>3,'post'=>4][$m[1]];
        return null;
    }
    private static function snapshot(Repository $repo):array {
        $rows=$repo->all('SELECT module_id,enabled,revision,updated_at FROM production_module_flags ORDER BY module_id');
        if(count($rows)!==25)\kg_json(503,['error'=>'production_module_policy_incomplete']);
        $map=[];
        foreach($rows as $r) {
            $id=(int)$r['module_id'];
            if($id<1||$id>25||isset($map[$id]))\kg_json(503,['error'=>'production_module_policy_invalid']);
            $map[$id]=$r;
        }
        return $map;
    }
    private static function effective(int $id,array $rows):bool {
        if(empty($rows[$id]['enabled']))return false;
        foreach(self::DEPENDENCIES[$id]??[] as $parent)
            if(!self::effective($parent,$rows))return false;
        return true;
    }
    public static function enforce(Repository $repo,string $path):void {
        $id=self::routeModule($path);
        if($id===null)return;
        $rows=self::snapshot($repo);
        if(!self::effective($id,$rows))\kg_json(404,['error'=>'module_disabled','module_id'=>$id]);
    }
    public static function handles(string $path):bool {
        return $path==='/api/v1/platform/modules'||$path==='/api/v1/admin/platform/modules/events'||
          (bool)preg_match('~^/api/v1/admin/platform/modules/(?:[1-9]|1[0-9]|2[0-5])$~D',$path);
    }
    public static function dispatch(string $method,string $path,Repository $repo,?array $identity):never {
        if($path==='/api/v1/platform/modules'&&$method==='GET') {
            $rows=self::snapshot($repo);
            $items=[];
            for($i=1;$i<=25;$i++)$items[]=[
                'module_id'=>$i,'enabled'=>self::effective($i,$rows),
                'configured_enabled'=>(bool)$rows[$i]['enabled'],
                'revision'=>(int)$rows[$i]['revision'],
                'depends_on'=>self::DEPENDENCIES[$i]??[]
            ];
            \kg_json(200,['items'=>$items,'production_policy'=>true,'controls_server_enforced'=>true]);
        }
        if($path==='/api/v1/admin/platform/modules/events'&&$method==='GET') {
            PlatformCommon::requireVerified($identity,['admin']);
            $history=$repo->all('SELECT e.id,e.module_id,e.cause_module_id,e.old_enabled,
                e.new_enabled,e.created_at,u.display_name AS actor
                FROM production_module_events e JOIN users u ON u.id=e.actor_id
                ORDER BY e.created_at DESC,e.id DESC LIMIT 30');
            \kg_json(200,['items'=>$history,'append_only'=>true]);
        }
        if($method==='PUT'&&preg_match('~^/api/v1/admin/platform/modules/([1-9]|1[0-9]|2[0-5])$~D',$path,$m)) {
            $actor=PlatformCommon::requireVerified($identity,['admin']);
            $body=PlatformCommon::mutation(300);
            $id=(int)$m[1];$enabled=$body['enabled']??null;
            $revision=$body['expected_revision']??null;
            if(!is_bool($enabled)||!is_int($revision)||$revision<1)
                \kg_json(422,['error'=>'invalid_module_policy_change']);
            $changed=$repo->transaction(function()use($repo,$actor,$id,$enabled,$revision):array {
                // One ordered lock sequence for all admin updates; avoids dependency races.
                $locked=$repo->all('SELECT module_id,enabled,revision FROM production_module_flags ORDER BY module_id FOR UPDATE');
                if(count($locked)!==25)\kg_json(503,['error'=>'production_module_policy_incomplete']);
                $states=[];
                foreach($locked as $row)$states[(int)$row['module_id']]=$row;
                if(!isset($states[$id])||(int)$states[$id]['revision']!==$revision)
                    \kg_json(409,['error'=>'module_revision_conflict']);
                if($enabled) {
                    foreach(self::DEPENDENCIES[$id]??[] as $parent)
                        if(empty($states[$parent]['enabled']))
                            \kg_json(409,['error'=>'dependency_required','module_id'=>$parent]);
                }
                $target=[$id=>$enabled];
                if(!$enabled){
                    // Cascade disabling dependent services, including transitive dependencies.
                    $loop=true;
                    while($loop){
                        $loop=false;
                        foreach(self::DEPENDENCIES as $child=>$parents){
                            if(isset($target[$child])&&$target[$child]===false)continue;
                            foreach($parents as $parent)if(($target[$parent]??null)===false){
                                $target[$child]=false;$loop=true;break;
                            }
                        }
                    }
                }
                $changed=[];
                foreach($target as $module=>$next){
                    if((bool)$states[$module]['enabled']===$next)continue;
                    $repo->exec('UPDATE production_module_flags SET enabled=?,revision=revision+1,updated_by=? WHERE module_id=?',
                        [$next?1:0,(int)$actor['id'],$module]);
                    $repo->exec('INSERT INTO production_module_events
                      (id,module_id,cause_module_id,actor_id,old_enabled,new_enabled)
                      VALUES (?,?,?,?,?,?)',[
                        PlatformCommon::uuid(),$module,$id,(int)$actor['id'],
                        (int)$states[$module]['enabled'],$next?1:0]);
                    $changed[]=$module;
                }

                return $changed;
            });
            \kg_json(200,['changed'=>$changed,'module_id'=>$id,
              'enabled'=>$enabled,'production_policy'=>true]);
        }
        \kg_json(405,['error'=>'method_not_allowed']);
    }
}
