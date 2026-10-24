<?php
declare(strict_types=1);
namespace KrishiGo\Json;
use RuntimeException;

/** Bounded, crash-recoverable diagnostic job queue. Never executes external actions. */
final class Queue {
 private string $dir;
 private const MAX_ITEMS=100;
 private const MAX_ATTEMPTS=3;
 public function __construct(string $dir) {
  $resolved=realpath($dir);$public=realpath((string)($_SERVER['DOCUMENT_ROOT']??''));
  if($resolved===false||!is_dir($resolved)||!is_writable($resolved)||
     ($public!==false&&($resolved===$public||str_starts_with($resolved,$public.DIRECTORY_SEPARATOR))))
      throw new RuntimeException('QUEUE_STORAGE_UNAVAILABLE');
  $this->dir=$resolved;
 }
 private function file(string $name):string {return $this->dir.'/safe-jobs-'.$name.'.json';}
 private function empty():array{return ['schema'=>1,'next_id'=>1,'items'=>[]];}
 private function valid(mixed $doc):bool{
  if(!is_array($doc)||($doc['schema']??null)!==1||
     !is_int($doc['next_id']??null)||$doc['next_id']<1||
     !is_array($doc['items']??null)||!array_is_list($doc['items'])||
     count($doc['items'])>self::MAX_ITEMS)return false;
  $ids=[];
  foreach($doc['items'] as $job){
   if(!is_array($job)||!is_int($job['id']??null)||$job['id']<1||
      $job['id'] >= $doc['next_id']||isset($ids[$job['id']])||
      ($job['kind']??null)!=='domain_snapshot'||
      !in_array($job['domain']??null,array_keys(Services::MODULES),true)||
      !in_array($job['status']??null,['pending','leased','succeeded','failed','dead'],true)||
      !is_int($job['attempts']??null)||$job['attempts']<0||$job['attempts']>self::MAX_ATTEMPTS||
      !is_int($job['lease_until']??null)||$job['lease_until']<0||
      !is_string($job['token']??null)||strlen($job['token'])>64||
      !is_string($job['created_at']??null)||!is_string($job['last_error']??null)||
      strlen($job['last_error'])>64||!is_array($job['result']??null))return false;
   $ids[$job['id']]=true;
  }
  return true;
 }
 private function read(string $name):?array{
  $path=$this->file($name);
  if(!is_file($path)||is_link($path)||filesize($path)>200000)return null;
  try{$doc=json_decode((string)file_get_contents($path),true,16,JSON_THROW_ON_ERROR);}
  catch(\JsonException){return null;}
  return $this->valid($doc)?$doc:null;
 }
 private function write(string $name,array $doc):void{
  if(!$this->valid($doc))throw new RuntimeException('QUEUE_INVALID');
  $serialized=json_encode($doc,JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES);
  if(strlen($serialized)>200000)throw new RuntimeException('QUEUE_CAPACITY');
  $temp=tempnam($this->dir,'kg-q-');
  if($temp===false)throw new RuntimeException('QUEUE_WRITE_FAILED');
  try{
   if(!chmod($temp,0600)||file_put_contents($temp,$serialized,LOCK_EX)!==strlen($serialized)
      ||!rename($temp,$this->file($name)))throw new RuntimeException('QUEUE_WRITE_FAILED');
  }finally{if(is_file($temp))@unlink($temp);}
 }
 private function state():array{
  $doc=$this->read('state');
  if($doc!==null)return ['doc'=>$doc,'recovered'=>false];
  $good=$this->read('last-good');
  if($good!==null){$this->write('state',$good);return ['doc'=>$good,'recovered'=>true];}
  if(is_file($this->dir.'/safe-jobs.initialized')||is_file($this->file('state'))||
    is_file($this->file('last-good')))throw new RuntimeException('QUEUE_UNRECOVERABLE');
  $doc=$this->empty();
  $this->write('state',$doc);$this->write('last-good',$doc);
  if(file_put_contents($this->dir.'/safe-jobs.initialized',"1",LOCK_EX)===false)throw new RuntimeException('QUEUE_WRITE_FAILED');
  return ['doc'=>$doc,'recovered'=>false];
 }
 private function locked(callable $callback):mixed{
  $fp=@fopen($this->dir.'/safe-jobs.lock','c+');
  if($fp===false||!flock($fp,LOCK_EX))throw new RuntimeException('QUEUE_LOCK_FAILED');
  try{return $callback($this->state());}
  finally{flock($fp,LOCK_UN);fclose($fp);}
 }
 private function persist(array $doc):void{
  $this->write('state',$doc);$this->write('last-good',$doc);
 }
 private static function publicJob(array $job):array{
  unset($job['token']);return $job;
 }
 public function list():array{
  return $this->locked(function($state){
   $items=array_map(self::publicJob(...),array_reverse($state['doc']['items']));
   $counts=array_fill_keys(['pending','leased','succeeded','failed','dead'],0);
   foreach($state['doc']['items'] as $job)$counts[$job['status']]++;
   return ['items'=>$items,'health'=>['ok'=>true,'database'=>'none','recovered'=>$state['recovered'],'counts'=>$counts]];
  });
 }
 public function enqueue(string $domain):array{
  if(!in_array($domain,array_keys(Services::MODULES),true))throw new RuntimeException('QUEUE_KIND_FORBIDDEN');
  return $this->locked(function($state)use($domain){
   $doc=$state['doc'];
   foreach($doc['items'] as $item)if($item['domain']===$domain&&in_array($item['status'],['pending','leased'],true))
      return ['job'=>self::publicJob($item),'deduplicated'=>true];
   if(count($doc['items'])>=self::MAX_ITEMS)throw new RuntimeException('QUEUE_CAPACITY');
   $job=['id'=>$doc['next_id']++,'kind'=>'domain_snapshot','domain'=>$domain,
    'status'=>'pending','attempts'=>0,'lease_until'=>0,'token'=>'','created_at'=>gmdate('c'),
    'last_error'=>'','result'=>[]];
   $doc['items'][]=$job;$this->persist($doc);
   return ['job'=>self::publicJob($job),'deduplicated'=>false];
  });
 }
 private function lease():?array{
  return $this->locked(function($state){
   $doc=$state['doc'];
   foreach($doc['items'] as &$job){
    if($job['status']!=='pending')continue;
    $job['status']='leased';$job['attempts']++;$job['lease_until']=time()+90;$job['token']=bin2hex(random_bytes(12));
    $copy=$job;unset($job);$this->persist($doc);return $copy;
   }
   return null;
  });
 }
 private function finish(array $leased,?array $result,?string $error):void{
  $this->locked(function($state)use($leased,$result,$error){
   $doc=$state['doc'];
   foreach($doc['items'] as &$job){
    if($job['id']!==$leased['id'])continue;
    if($job['status']!=='leased'||!hash_equals($job['token'],$leased['token']))return null;
    $job['status']=$error===null?'succeeded':'failed';
    $job['last_error']=$error===null?'':substr($error,0,64);
    $job['result']=$result??[];$job['lease_until']=0;$job['token']='';
    unset($job);$this->persist($doc);return null;
   }
   return null;
  });
 }
 /** Manual, bounded batch. May read counts, never send messages, trade or run subprocesses. */
 public function process(Store $store,int $max=3):array{
  $processed=0;$failed=0;
  for($i=0;$i<min(3,max(1,$max));$i++){
   $job=$this->lease();if($job===null)break;
   try{
    $data=$store->records($job['domain'],null,true);
    $result=['pending_demo_count'=>count($data['items']),'snapshot_recovered'=>$data['recovered']];
    $this->finish($job,$result,null);$processed++;
   }catch(\Throwable){$this->finish($job,null,'snapshot_unavailable');$failed++;}
  }
  return ['processed'=>$processed,'failed'=>$failed,'external_actions'=>false];
 }
 /** Never automatic: an admin explicitly releases timed-out/failed diagnostic jobs. */
 public function recover():array{
  return $this->locked(function($state){
   $doc=$state['doc'];$changed=0;
   foreach($doc['items'] as &$job){
    $expired=$job['status']==='leased'&&$job['lease_until']<time();
    if(!$expired&&$job['status']!=='failed')continue;
    $job['status']=$job['attempts']>=self::MAX_ATTEMPTS?'dead':'pending';
    $job['token']='';$job['lease_until']=0;$changed++;
   }
   unset($job);
   if($changed)$this->persist($doc);
   return ['recovered_jobs'=>$changed,'automatically_replayed'=>false];
  });
 }
}
