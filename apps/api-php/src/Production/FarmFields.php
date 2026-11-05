<?php
declare(strict_types=1);
namespace KrishiGo\Production;

/** Authenticated farm plot records: only owner can read, create or edit. */
final class FarmFields {
    public static function handles(string $path):bool {
        return $path==='/api/v1/me/fields'||
            (bool)preg_match('~^/api/v1/me/fields/[0-9a-f-]{36}$~D',$path);
    }
    public static function dispatch(string $method,string $path,Repository $repo,?array $identity):never {
        $user=PlatformCommon::requireUser($identity,['farmer','fpo','admin']);
        $uid=(int)$user['id'];
        if($path==='/api/v1/me/fields'&&$method==='GET'){
            $rows=$repo->all('SELECT id,field_name,district,village,crop,area_hectares,status,revision,created_at,updated_at
              FROM farm_fields WHERE owner_id=? ORDER BY created_at DESC,id DESC LIMIT 50',[$uid]);
            \kg_json(200,['items'=>$rows,'private'=>true,'owner_scoped'=>true]);
        }
        if($path==='/api/v1/me/fields'&&$method==='POST'){
            PlatformCommon::requireVerified($identity,['farmer','fpo','admin']);
            $body=PlatformCommon::mutation(2200);
            $fieldName=Validation::text($body,'field_name',100,2);
            $district=Validation::text($body,'district',100,2);
            $village=isset($body['village'])&&$body['village']!==''?Validation::text($body,'village',100):'';
            $crop=Validation::text($body,'crop',100,2);
            $area=Validation::number($body,'area_hectares',0.01,100000);
            $repo->throttle('field-create',(string)$uid,30,3600);
            $id=PlatformCommon::uuid();
            $repo->transaction(function()use($repo,$id,$uid,$fieldName,$district,$village,$crop,$area):void{
                $repo->exec('INSERT INTO farm_fields(id,owner_id,field_name,district,village,crop,area_hectares)
                   VALUES (?,?,?,?,?,?,?)',[$id,$uid,$fieldName,$district,$village,$crop,$area]);
                PlatformCommon::audit($repo,$uid,'create','farm_field',$id,'Private farm plot created');
            });
            \kg_json(201,['id'=>$id,'status'=>'active','revision'=>1,'stored'=>true,
                 'owner_scoped'=>true,'public_location_shared'=>false]);
        }
        if(preg_match('~^/api/v1/me/fields/([0-9a-f-]{36})$~D',$path,$match)){
            $id=PlatformCommon::id($match[1]);
            if($method==='GET'){
                $row=$repo->one('SELECT id,field_name,district,village,crop,area_hectares,status,
                      revision,created_at,updated_at FROM farm_fields WHERE id=? AND owner_id=?',[$id,$uid]);
                if(!$row)\kg_json(404,['error'=>'not_found']);
                \kg_json(200,['field'=>$row,'private'=>true]);
            }
            if($method==='PATCH'){
                PlatformCommon::requireVerified($identity,['farmer','fpo','admin']);
                $b=PlatformCommon::mutation(2200);
                $revision=$b['expected_revision']??null;
                if(!is_int($revision)||$revision<1)\kg_json(422,['error'=>'expected_revision_required']);
                $allowed=['field_name','district','village','crop','area_hectares'];
                $updates=[];$params=[];
                foreach($allowed as $field){
                    if(!array_key_exists($field,$b))continue;
                    if($field==='area_hectares')$value=Validation::number($b,$field,0.01,100000);
                    elseif($field==='village')$value=$b[$field]===''?'':Validation::text($b,$field,100);
                    else $value=Validation::text($b,$field,100,2);
                    $updates[]=$field.'=?';$params[]=$value;
                }
                if(array_key_exists('status',$b)){
                    if($b['status']!=='archived')\kg_json(422,['error'=>'status_only_archive_allowed']);
                    $updates[]='status=?';$params[]='archived';
                }
                foreach(array_keys($b) as $key)
                    if($key!=='expected_revision'&&!in_array($key,[...$allowed,'status'],true))
                        \kg_json(422,['error'=>'unexpected_field']);
                if(!$updates)\kg_json(422,['error'=>'no_changes']);
                $next=$repo->transaction(function()use($repo,$id,$uid,$revision,$updates,$params):int{
                    $row=$repo->one('SELECT status,revision FROM farm_fields WHERE id=? AND owner_id=? FOR UPDATE',[$id,$uid]);
                    if(!$row)\kg_json(404,['error'=>'not_found']);
                    if($row['status']!=='active')\kg_json(409,['error'=>'archived_field_locked']);
                    if((int)$row['revision']!==$revision)\kg_json(409,['error'=>'field_revision_conflict']);
                    $fields=implode(',',$updates);
                    $repo->exec('UPDATE farm_fields SET '.$fields.',revision=revision+1 WHERE id=? AND owner_id=?',
                        [...$params,$id,$uid]);
                    PlatformCommon::audit($repo,$uid,'update','farm_field',$id,'Owner updated private field data');
                    return $revision+1;
                });
                \kg_json(200,['id'=>$id,'revision'=>$next,'updated'=>true,'owner_scoped'=>true]);
            }
        }
        \kg_json(405,['error'=>'method_not_allowed']);
    }
}
