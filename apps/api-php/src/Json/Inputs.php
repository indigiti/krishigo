<?php
declare(strict_types=1);
namespace KrishiGo\Json;
use RuntimeException;

/** Authenticated, opt-in module 11 JSON staging API. Not a public inputs service. */
final class Inputs {
    private const ROLES=['farmer','buyer','fpo','editor','admin'];
    private const MODERATORS=['editor','admin'];
    private static function fail(RuntimeException $e): never {
        $name=$e->getMessage();
        if(in_array($name,['UNKNOWN_DOMAIN','RECORD_NOT_FOUND'],true))\kg_json(404,['error'=>'not_found']);
        if(in_array($name,['ALREADY_REVIEWED','IDEMPOTENCY_CONFLICT'],true))\kg_json(409,['error'=>'conflict']);
        if($name==='JSON_CAPACITY_REACHED')\kg_json(507,['error'=>'input_store_at_capacity']);
        \kg_json(503,['error'=>'input_store_unavailable']);
    }
    private static function throttle():void {
        \kg_begin_session();$now=time();$start=(int)($_SESSION['input_since']??$now);
        $n=(int)($_SESSION['input_count']??0);
        if($now-$start>900){$start=$now;$n=0;}
        if($n>=40)\kg_json(429,['error'=>'input_rate_limit']);
        $_SESSION['input_since']=$start;$_SESSION['input_count']=$n+1;
    }
    private static function mayCreate(string $kind,string $role):bool {
        if(in_array($kind,['products','sources','regulatory','recalls'],true))
            return in_array($role,self::MODERATORS,true);
        if(in_array($kind,['suppliers','offers'],true))
            return in_array($role,['buyer','fpo','admin'],true);
        return in_array($role,self::ROLES,true);
    }
    public static function dispatch(string $method,string $path):never {
        if(\kg_env('KRISHIGO_JSON_WORKFLOWS')!=='enabled')\kg_json(404,['error'=>'input_pilot_disabled']);
        if(!\kg_stage_auth_enabled())\kg_json(503,['error'=>'stage_auth_required']);
        $user=\kg_require_roles(self::ROLES);
        $directory=\kg_env('KRISHIGO_JSON_STORE_DIR');
        if($directory==='')\kg_json(503,['error'=>'private_store_not_configured']);
        try {
            $registry=new \KrishiGo\Modules\Registry(dirname(__DIR__,2).'/fixtures/module-registry.json',$directory);
            $module=array_values(array_filter($registry->snapshot()['modules'],static fn($x)=>$x['id']===11));
            if(!$module||!$module[0]['enabled'])\kg_json(404,['error'=>'module_disabled']);
            $store=new Store($directory);
            $root='/api/v1/staging/inputs';
            if($method==='GET'&&$path===$root.'/capabilities')
                \kg_json(200,['staging_only'=>true,'module'=>11,'private_json'=>true,
                    'real_ocr'=>false,'generative_ai'=>false,'real_notifications'=>false,'in_app_watch_alerts'=>true,
                    'verified_external_feeds'=>false,'real_sales'=>false,'live_subscriptions'=>false,
                    'collections'=>InputContracts::kinds()]);
            if($method==='GET'&&$path===$root.'/schemas'){
                $specs=[];
                foreach(InputContracts::kinds() as $kind)$specs[$kind]=[
                    'fields'=>InputContracts::fields($kind),'private'=>InputContracts::isPrivate($kind),
                    'create_allowed'=>self::mayCreate($kind,$user['role'])];
                \kg_json(200,['staging_only'=>true,'schemas'=>$specs]);
            }
            if($method==='GET'&&in_array($path,[$root.'/search',$root.'/assistant'],true)){
                $term=$_GET['q']??'';
                if(!is_string($term)||strlen($term)>80)\kg_json(422,['error'=>'invalid_query']);
                // Curated keyword aliases: no automatic translation of treatment claims.
                $aliases=['कीटकनाशक'=>'insecticide','कीटनाशक'=>'insecticide',
                    'बुरशीनाशक'=>'fungicide','कवकनाशी'=>'fungicide',
                    'तणनाशक'=>'herbicide','खरपतवारनाशी'=>'herbicide',
                    'सूक्ष्म अन्नद्रव्य'=>'micronutrient','सूक्ष्म पोषक तत्व'=>'micronutrient',
                    'खत'=>'fertilizer','उर्वरक'=>'fertilizer','जस्त'=>'zinc','जिंक'=>'zinc'];
                $needle=$aliases[trim($term)]??trim($term);
                $hits=[];
                if(strlen(trim($term))>=2)foreach(['products','sources','regulatory'] as $kind){
                    foreach($store->records('input-'.$kind)['items'] as $record){
                        $f=$record['fields'];
                        if(stripos(implode(' ',array_values($f)),$needle)===false)continue;
                        $hits[]=['kind'=>$kind,'id'=>$record['id'],
                            'title'=>$f['name']??$f['title']??'Staging reference',
                            'summary'=>$f['composition']??$f['claim']??$f['summary']??'',
                            'source_url'=>$f['source_url'],
                            'source_date'=>$f['checked_on']??$f['published_on']??'',
                            'status'=>'reviewed-demo'];
                        if(count($hits)>=20)break 2;
                    }
                }
                \kg_json(200,['staging_only'=>true,'results'=>$hits,'generative_ai'=>false,
                    'answer'=>count($hits)?'Human-reviewed staging records only. Confirm the cited official label and current regulatory status before use.':'No reviewed staging evidence found; no agricultural recommendation can be made.']);
            }
            // In-app-only batch alerts: owner must first opt in to a private watch.
            if($method==='GET'&&$path===$root.'/watch-alerts'){
                $watches=$store->records('input-watches',$user['name'])['items'];
                $recalls=$store->records('input-recalls')['items'];
                $hits=[];
                foreach($watches as $watch)foreach($recalls as $recall){
                    $w=$watch['fields'];$r=$recall['fields'];
                    if($w['consent']!=='in_app_only')continue;
                    if(strcasecmp(trim($w['batch']),trim($r['batch']))!==0||
                       strcasecmp(trim($w['product']),trim($r['product']))!==0)continue;
                    $hits[]=['watch_id'=>$watch['id'],'recall'=>$r,
                        'reviewed_demo'=>true];
                    if(count($hits)>=30)break 2;
                }
                \kg_json(200,['staging_only'=>true,'alerts'=>$hits,
                    'in_app_only'=>true,'email_sent'=>false,'whatsapp_sent'=>false,
                    'official_feed_connected'=>false]);
            }
            if($method==='GET'&&$path===$root.'/regulatory-updates'){
                $since=$_GET['since']??'';
                if(!is_string($since)||($since!==''&&
                   (!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$since)||$since>gmdate('Y-m-d'))))
                   \kg_json(422,['error'=>'invalid_since']);
                $updates=[];
                foreach($store->records('input-regulatory')['items'] as $row){
                    $sourceDate=$row['fields']['published_on'];
                    if($since!==''&&$sourceDate<$since)continue;
                    $updates[]=['id'=>$row['id'],'fields'=>$row['fields'],'status'=>'reviewed-demo'];
                }
                \kg_json(200,['staging_only'=>true,'updates'=>$updates,
                    'live_source_monitoring'=>false,'in_app_only'=>true]);
            }
            if(preg_match('~^/api/v1/staging/inputs/records/watches/([1-9][0-9]{0,8})$~D',$path,$revoke)){
                if($method!=='DELETE')\kg_json(405,['error'=>'method_not_allowed']);
                \kg_check_csrf();self::throttle();
                $store->deleteOwned('input-watches',(int)$revoke[1],$user['name']);
                \kg_json(200,['staging_only'=>true,'deleted'=>true,'notifications_sent'=>false]);
            }
            if($method==='GET'&&$path===$root.'/alerts'){
                $batch=$_GET['batch']??'';
                if(!is_string($batch)||strlen($batch)>100)\kg_json(422,['error'=>'invalid_batch']);
                $matches=[];
                if(trim($batch)!=='')foreach($store->records('input-recalls')['items'] as $r){
                    if(strcasecmp(trim($r['fields']['batch']),trim($batch))===0)
                        $matches[]=['status'=>'reviewed-demo','fields'=>$r['fields']];
                }
                \kg_json(200,['staging_only'=>true,'matches'=>$matches,
                    'official_recall_feed_connected'=>false,'notifications_sent'=>false]);
            }
            if(preg_match('~^/api/v1/staging/inputs/records/([a-z]+)$~D',$path,$matches)){
                $kind=$matches[1];InputContracts::fields($kind);$domain='input-'.$kind;
                if($method==='GET'){
                    $mine=($_GET['mine']??'')==='1';
                    if(InputContracts::isPrivate($kind)&&!$mine)\kg_json(403,['error'=>'private_only']);
                    $records=$store->records($domain,$mine?$user['name']:null);
                    \kg_json(200,['staging_only'=>true,'items'=>$records['items'],'private'=>InputContracts::isPrivate($kind)]);
                }
                if($method==='POST'){
                    if(!self::mayCreate($kind,$user['role']))\kg_json(403,['error'=>'role_forbidden']);
                    \kg_check_csrf();self::throttle();
                    $key=(string)($_SERVER['HTTP_IDEMPOTENCY_KEY']??'');
                    if(!preg_match('/^[A-Za-z0-9_-]{16,64}$/D',$key))
                        \kg_json(422,['error'=>'idempotency_key_required']);
                    $input=InputContracts::validate($kind,\kg_json_input(4096));
                    $result=$store->create($domain,$user['name'],$input,$key);
                    \kg_json($result['created']?201:200,['staging_only'=>true,
                       'item'=>$result['item'],'replayed'=>!$result['created'],
                       'external_publication'=>false,'messages_sent'=>false]);
                }
                \kg_json(405,['error'=>'method_not_allowed']);
            }
            if(preg_match('~^/api/v1/staging/inputs/admin/([a-z]+)(?:/([1-9][0-9]{0,8})/review)?$~D',$path,$matches)){
                $kind=$matches[1];InputContracts::fields($kind);
                \kg_require_roles(self::MODERATORS);
                if(InputContracts::isPrivate($kind)&&!in_array($kind,['ocr','plans','expert'],true))
                    \kg_json(403,['error'=>'private_only']);
                if($method==='GET'&&!isset($matches[2])){
                    \kg_json(200,['staging_only'=>true,
                        'pending'=>$store->records('input-'.$kind,null,true)['items']]);
                }
                if($method==='POST'&&isset($matches[2])){
                    \kg_check_csrf();self::throttle();$request=\kg_json_input(512);
                    $decision=$request['decision']??null;$reason=$request['reason']??null;
                    if(!in_array($decision,['approve','reject'],true)||!is_string($reason)||
                        strlen(trim($reason))<10||strlen($reason)>300)
                        \kg_json(422,['error'=>'review_reason_required']);
                    $row=$store->review('input-'.$kind,(int)$matches[2],$decision,$user['name'],trim($reason));
                    \kg_json(200,['staging_only'=>true,'item'=>$row,
                        'regulatory_certification'=>false,'externally_published'=>false]);
                }
                \kg_json(405,['error'=>'method_not_allowed']);
            }
            \kg_json(404,['error'=>'not_found']);
        }catch(RuntimeException $e){self::fail($e);}
    }
}
