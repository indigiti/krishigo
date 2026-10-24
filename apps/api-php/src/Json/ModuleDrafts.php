<?php
declare(strict_types=1);
namespace KrishiGo\Json;
use RuntimeException;

/** Every module has a private test-draft adapter. This does not implement its real integration. */
final class ModuleDrafts {
 public static function dispatch(string $method,string $path): never {
  if(\kg_env('KRISHIGO_JSON_WORKFLOWS')!=='enabled')\kg_json(404,['error'=>'json_workflows_disabled']);
  if(!\kg_stage_auth_enabled())\kg_json(503,['error'=>'staging_auth_required']);
  if(!preg_match('~^/api/v1/staging/module-drafts/([1-9]|1[0-9]|2[0-5])(/schema)?$~D',$path,$matches))
     \kg_json(404,['error'=>'unknown_module']);
  $user=\kg_require_roles(['farmer','buyer','fpo','editor','admin']);
  $dir=\kg_env('KRISHIGO_JSON_STORE_DIR');
  if($dir==='')\kg_json(503,['error'=>'json_store_not_configured']);
  try {
   $module=(int)$matches[1];
   $catalog=new \KrishiGo\Modules\Registry(dirname(__DIR__,2).'/fixtures/module-registry.json',$dir);
   $active=false;
   foreach($catalog->snapshot()['modules'] as $entry)
    if($entry['id']===$module){$active=$entry['enabled'];break;}
   if(!$active)\kg_json(404,['error'=>'module_disabled']);
   $contract=new Contracts(dirname(__DIR__,2).'/fixtures/module-workflow-contracts.json');
   if(isset($matches[2]) && $matches[2]==='/schema'){
    if($method!=='GET')\kg_json(405,['error'=>'method_not_allowed']);
    \kg_json(200,$contract->forModule($module));
   }
   $store=new Store($dir);$domain='module-'.$module;
   if($method==='GET'){
    $records=$store->records($domain,$user['name']);
    \kg_json(200,['demo'=>true,'module_id'=>$module,'private'=>true,'items'=>$records['items'],'recovered'=>$records['recovered']]);
   }
   if($method==='POST'){
    if(!$contract->authorized($module,$user['role']))\kg_json(403,['error'=>'role_forbidden']);
    \kg_check_csrf();
    $key=(string)($_SERVER['HTTP_IDEMPOTENCY_KEY']??'');
    if(!preg_match('/^[A-Za-z0-9_-]{16,64}$/D',$key))\kg_json(422,['error'=>'idempotency_key_required']);
    $input=\kg_json_input(2048);
    $details=$contract->validate($module,$input['details']??null);
    $title=$input['title']??null;$note=$input['note']??null;
    if(!is_string($title)||!is_string($note)||trim($title)===''||trim($note)===''||
       strlen($title)>120||strlen($note)>700)\kg_json(422,['error'=>'invalid_fields']);
    $result=$store->create($domain,$user['name'],['title'=>trim($title),'note'=>trim($note)]+$details,$key);
    \kg_json($result['created']?201:200,['demo'=>true,'private'=>true,'item'=>$result['item'],'replayed'=>!$result['created']]);
   }
   \kg_json(405,['error'=>'method_not_allowed']);
  }catch(RuntimeException $e){
   if($e->getMessage()==='FIELD_INVALID')\kg_json(422,['error'=>'module_fields_invalid']);
   \kg_json(503,['error'=>'module_draft_store_unavailable']);
  }
 }
}
