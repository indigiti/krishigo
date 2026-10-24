<?php
declare(strict_types=1);
namespace KrishiGo\Json;
use RuntimeException;

/** Staging-only, fictional JSON CRUD and review. No external publication. */
final class Api {
    private static function fail(RuntimeException $e): never {
        $error=$e->getMessage();
        if(in_array($error,['UNKNOWN_DOMAIN','RECORD_NOT_FOUND'],true))\kg_json(404,['error'=>'not_found']);
        if($error==='MODULE_DISABLED')\kg_json(404,['error'=>'module_disabled']);
        if($error==='FIELD_INVALID')\kg_json(422,['error'=>'invalid_fields']);
        if(in_array($error,['IDEMPOTENCY_CONFLICT','ALREADY_REVIEWED'],true))\kg_json(409,['error'=>strtolower($error)]);
        if($error==='JSON_CAPACITY_REACHED')\kg_json(507,['error'=>'staging_capacity_reached']);
        \kg_json(503,['error'=>'json_workflow_unavailable']);
    }
    private static function throttle(): void {
        \kg_begin_session();
        $now=time();$start=(int)($_SESSION['json_window']??$now);
        $n=(int)($_SESSION['json_count']??0);
        if($now-$start>900){$start=$now;$n=0;}
        if($n>=60)\kg_json(429,['error'=>'staging_rate_limit']);
        $_SESSION['json_window']=$start;$_SESSION['json_count']=$n+1;
    }
    public static function dispatch(string $method,string $path): never {
        if(\kg_env('KRISHIGO_JSON_WORKFLOWS')!=='enabled')\kg_json(404,['error'=>'json_workflows_disabled']);
        if(!\kg_stage_auth_enabled())\kg_json(503,['error'=>'staging_auth_required']);
        $dir=\kg_env('KRISHIGO_JSON_STORE_DIR');
        if($dir==='')\kg_json(503,['error'=>'json_store_not_configured']);
        try{
            $repo=new Store($dir);
            $modules=new \KrishiGo\Modules\Registry(dirname(__DIR__,2).'/fixtures/module-registry.json',$dir);
            $service=new Services($repo,$modules);
            if($path==='/api/v1/staging/jobs'||
               $path==='/api/v1/staging/jobs/process'||
               $path==='/api/v1/staging/jobs/recover'){
                \kg_require_roles(['admin','editor']);
                $queue=new Queue($dir);
                if($path==='/api/v1/staging/jobs'&&$method==='GET')\kg_json(200,$queue->list());
                if($method!=='POST')\kg_json(405,['error'=>'method_not_allowed']);
                \kg_check_csrf();self::throttle();
                $body=\kg_json_input(256);
                if($path==='/api/v1/staging/jobs'){
                    if(($body['kind']??null)!=='domain_snapshot'||
                       !is_string($body['domain']??null))\kg_json(422,['error'=>'unsupported_job']);
                    $service->assertEnabled($body['domain']);
                    \kg_json(202,$queue->enqueue($body['domain']));
                }
                if($path==='/api/v1/staging/jobs/process')\kg_json(200,$queue->process($repo));
                \kg_json(200,$queue->recover());
            }
            if($path==='/api/v1/staging/workflows/health'&&$method==='GET'){
                \kg_require_roles(['admin','editor']);\kg_json(200,$service->health());
            }
            if(preg_match('~^/api/v1/staging/records/([a-z]+)$~D',$path,$match)){
                $domain=$match[1];$service->assertEnabled($domain);
                if($method==='GET'){
                    $mine=($_GET['mine']??'')==='1';
                    if($domain==='plant'&&!$mine)\kg_json(403,['error'=>'private_records_only']);
                    $owner=null;
                    if($mine)$owner=\kg_require_roles(['farmer','buyer','fpo','editor','admin'])['name'];
                    $result=$repo->records($domain,$owner);
                    \kg_json(200,['demo'=>true,'items'=>$result['items'],'recovered'=>$result['recovered']]);
                }
                if($method==='POST'){
                    $identity=\kg_require_roles(['farmer','buyer','fpo','editor','admin']);
                    if(!$service->allowWrite($domain,$identity['role']))\kg_json(403,['error'=>'role_forbidden']);
                    \kg_check_csrf();self::throttle();
                    $key=(string)($_SERVER['HTTP_IDEMPOTENCY_KEY']??'');
                    if(!preg_match('/^[A-Za-z0-9_-]{16,64}$/D',$key))\kg_json(422,['error'=>'idempotency_key_required']);
                    $fields=$service->validate($domain,\kg_json_input(2048));
                    $result=$repo->create($domain,$identity['name'],$fields,$key);
                    \kg_json($result['created']?201:200,['demo'=>true,'delivered'=>false,'item'=>$result['item'],'replayed'=>!$result['created']]);
                }
                \kg_json(405,['error'=>'method_not_allowed']);
            }
            if(preg_match('~^/api/v1/staging/admin/records/([a-z]+)$~D',$path,$match)){
                if($method!=='GET')\kg_json(405,['error'=>'method_not_allowed']);
                \kg_require_roles(['editor','admin']);
                $domain=$match[1];$service->assertEnabled($domain);
                if($domain==='plant')\kg_json(403,['error'=>'private_records_only']);
                \kg_json(200,['demo'=>true,'pending'=>$repo->records($domain,null,true)['items']]);
            }
            if(preg_match('~^/api/v1/staging/admin/records/([a-z]+)/([1-9][0-9]{0,8})/review$~D',$path,$match)){
                if($method!=='POST')\kg_json(405,['error'=>'method_not_allowed']);
                \kg_require_roles(['editor','admin']);
                $domain=$match[1];$service->assertEnabled($domain);
                if($domain==='plant')\kg_json(403,['error'=>'private_records_only']);
                \kg_check_csrf();self::throttle();
                $body=\kg_json_input(256);
                if(!in_array($body['decision']??null,['approve','reject'],true))\kg_json(422,['error'=>'decision_required']);
                $record=$repo->review($domain,(int)$match[2],$body['decision']);
                \kg_json(200,['demo'=>true,'published_externally'=>false,'item'=>$record]);
            }
            \kg_json(404,['error'=>'not_found']);
        }catch(RuntimeException $e){self::fail($e);}
    }
}
