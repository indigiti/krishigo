<?php
declare(strict_types=1);
namespace KrishiGo\Modules;
use RuntimeException;
/** Private, database-free, atomic feature registry. No production account storage. */
final class Registry {
 private array $entries; private string $dir='';
 public function __construct(string $fixture,string $dir=''){
  $raw=@file_get_contents($fixture);if(!is_string($raw))throw new RuntimeException('CATALOG_MISSING');
  try{$config=json_decode($raw,true,32,JSON_THROW_ON_ERROR);}catch(\JsonException){throw new RuntimeException('CATALOG_INVALID');}
  if(($config['schema']??null)!==1||count($config['modules']??[])!==25)throw new RuntimeException('CATALOG_INVALID');
  $this->entries=[];
  foreach($config['modules'] as $m){
   if(!is_int($m['id']??null)||!is_string($m['name']??null)||!is_array($m['dependencies']??null))throw new RuntimeException('CATALOG_INVALID');
   $this->entries[$m['id']]=$m;
  }
  if(count($this->entries)!==25)throw new RuntimeException('CATALOG_DUPLICATE');
  if($dir!==''){
   $resolved=realpath($dir);$public=realpath((string)($_SERVER['DOCUMENT_ROOT']??''));
   if($resolved===false||!is_dir($resolved)||!is_writable($resolved))throw new RuntimeException('STORE_UNAVAILABLE');
   if($public!==false&&($public===$resolved||str_starts_with($resolved,$public.DIRECTORY_SEPARATOR)))throw new RuntimeException('PUBLIC_STORE_FORBIDDEN');
   $this->dir=$resolved;
  }
 }
 public function configured():bool{return $this->dir!=='';}
 private function defaults():array{return array_fill_keys(array_keys($this->entries),true);}
 private function validate($doc):?array{
  if(!is_array($doc)||($doc['schema']??null)!==1||!is_array($doc['flags']??null)||count($doc['flags'])!==25)return null;
  $raw=$doc['flags'];$result=[];
  foreach($this->entries as $id=>$m){if(!array_key_exists($id,$raw)||!is_bool($raw[$id]))return null;$result[$id]=$raw[$id];}
  foreach($this->entries as $id=>$m)foreach($m['dependencies'] as $d)if(!isset($result[$d])||($result[$id]&&!$result[$d]))return null;
  return $result;
 }
 private function file(string $name):string{return $this->dir.'/modules-'.$name.'.json';}
 private function read(string $name):?array{
  $raw=@file_get_contents($this->file($name));if(!is_string($raw))return null;
  try{return $this->validate(json_decode($raw,true,32,JSON_THROW_ON_ERROR));}catch(\JsonException){return null;}
 }
 private function write(string $name,array $flags):void{
  $tmp=tempnam($this->dir,'kg-mod-');if($tmp===false)throw new RuntimeException('STORE_WRITE_FAILED');
  try{
   if(!@chmod($tmp,0600))throw new RuntimeException('STORE_WRITE_FAILED');
   $data=json_encode(['schema'=>1,'flags'=>$flags],JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES);
   if(file_put_contents($tmp,$data,LOCK_EX)!==strlen($data))throw new RuntimeException('STORE_WRITE_FAILED');
   if(!@rename($tmp,$this->file($name)))throw new RuntimeException('STORE_WRITE_FAILED');
  }finally{if(is_file($tmp))@unlink($tmp);}
 }
 private function state():array{
  if(!$this->configured())return ['flags'=>$this->defaults(),'recovered'=>false,'configured'=>false];
  if(!is_file($this->file('state'))&&!is_file($this->file('last-good'))){
   if(is_file($this->dir.'/modules.initialized'))throw new RuntimeException('STATE_UNRECOVERABLE');
   $flags=$this->defaults();$this->write('state',$flags);$this->write('last-good',$flags);
   if(file_put_contents($this->dir.'/modules.initialized','1',LOCK_EX)===false)throw new RuntimeException('STORE_WRITE_FAILED');
   return ['flags'=>$flags,'recovered'=>false,'configured'=>true];
  }
  $flags=$this->read('state');
  if($flags!==null)return ['flags'=>$flags,'recovered'=>false,'configured'=>true];
  $good=$this->read('last-good');
  if($good===null)throw new RuntimeException('STATE_UNRECOVERABLE');
  $this->write('state',$good);
  return ['flags'=>$good,'recovered'=>true,'configured'=>true];
 }
 private function locked(callable $fn):mixed{
  if(!$this->configured())return $fn();
  $fp=@fopen($this->dir.'/modules.lock','c+');if($fp===false)throw new RuntimeException('LOCK_UNAVAILABLE');
  try{if(!flock($fp,LOCK_EX))throw new RuntimeException('LOCK_UNAVAILABLE');return $fn();}
  finally{flock($fp,LOCK_UN);fclose($fp);}
 }
 public function snapshot():array{return $this->locked(function(){
  $state=$this->state();return ['schema'=>1,'modules'=>array_map(fn($m)=>[...$m,'enabled'=>$state['flags'][$m['id']]],array_values($this->entries)), 'configured'=>$state['configured'],'recovered'=>$state['recovered'],'database'=>'none'];
 });}
 public function update(int $id,bool $on):array{
  if(!$this->configured())throw new RuntimeException('STORE_NOT_CONFIGURED');
  return $this->locked(function()use($id,$on){
   if(!isset($this->entries[$id]))throw new RuntimeException('MODULE_UNKNOWN');
   $state=$this->state();$flags=$state['flags'];
   if($on){foreach($this->entries[$id]['dependencies'] as $d)if(!$flags[$d])throw new RuntimeException('DEPENDENCY_REQUIRED');$flags[$id]=true;}
   else{$flags[$id]=false;do{$repeat=false;foreach($this->entries as $key=>$m)if($flags[$key]&&count(array_filter($m['dependencies'],fn($d)=>!$flags[$d]))){$flags[$key]=false;$repeat=true;}}while($repeat);}
   $this->write('state',$flags);$this->write('last-good',$flags);
   return ['ok'=>true,'flags'=>$flags];
  });
 }
 public function reset():array{
  if(!$this->configured())throw new RuntimeException('STORE_NOT_CONFIGURED');
  return $this->locked(function(){$this->state();$flags=$this->defaults();$this->write('state',$flags);$this->write('last-good',$flags);return ['ok'=>true,'restored'=>true];});
 }
}
