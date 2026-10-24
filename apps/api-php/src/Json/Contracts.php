<?php
declare(strict_types=1);
namespace KrishiGo\Json;
use RuntimeException;

/** Read-only versioned module contracts. No live trading or production identity. */
final class Contracts {
 private array $modules;
 public function __construct(string $file) {
  $raw=@file_get_contents($file);
  if(!is_string($raw) || strlen($raw)>100000)throw new RuntimeException('CONTRACT_UNAVAILABLE');
  try{$doc=json_decode($raw,true,16,JSON_THROW_ON_ERROR);}
  catch(\JsonException){throw new RuntimeException('CONTRACT_INVALID');}
  if(($doc['schema']??null)!==1||!is_array($doc['modules']??null)||count($doc['modules'])!==25)
   throw new RuntimeException('CONTRACT_INVALID');
  $this->modules=$doc['modules'];
  for($id=1;$id<=25;$id++){
   $entry=$this->modules[$id]??null;
   if(!is_array($entry)||!is_array($entry['fields']??null)||
      count($entry['fields'])<2||count($entry['fields'])>8||
      !is_array($entry['roles']??null))throw new RuntimeException('CONTRACT_INVALID');
  }
 }
 public function forModule(int $id): array {
  $entry=$this->modules[$id]??null;
  if(!is_array($entry))throw new RuntimeException('CONTRACT_INVALID');
  return ['schema'=>1,'module_id'=>$id,'staging_only'=>true,'delivery_enabled'=>false,
          'purpose'=>$entry['purpose'],'roles'=>$entry['roles'],'fields'=>$entry['fields']];
 }
 public function authorized(int $id,string $role): bool {
  return in_array($role,$this->forModule($id)['roles'],true);
 }
 /** Returns flat scalar fields compatible with the locked JSON record repository. */
 public function validate(int $id,mixed $detail):array {
  $fields=$this->forModule($id)['fields'];
  if(!is_array($detail)||array_is_list($detail))throw new RuntimeException('FIELD_INVALID');
  $expected=array_column($fields,'key');
  if(count($detail)!==count($expected)||count(array_diff(array_keys($detail),$expected))!==0)
   throw new RuntimeException('FIELD_INVALID');
  $validated=[];
  foreach($fields as $field){
   $key=$field['key'];$value=$detail[$key]??null;$type=$field['type'];
   if(!is_string($key)||!preg_match('/^[a-z][a-z0-9_]{0,31}$/D',$key))
    throw new RuntimeException('CONTRACT_INVALID');
   if($type==='integer') {
    if(!is_int($value)||$value<1||$value>(int)$field['max'])throw new RuntimeException('FIELD_INVALID');
   }elseif($type==='date'){
    if(!is_string($value)||!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$value))
      throw new RuntimeException('FIELD_INVALID');
    [$year,$month,$day]=array_map('intval',explode('-',$value));
    if(!checkdate($month,$day,$year))throw new RuntimeException('FIELD_INVALID');
   }elseif($type==='enum'){
    if(!is_string($value)||!in_array($value,$field['options']??[],true))
     throw new RuntimeException('FIELD_INVALID');
   }elseif($type==='https_url'){
    if(!is_string($value)||strlen($value)>($field['max']??300)||
       !str_starts_with($value,'https://')||filter_var($value,FILTER_VALIDATE_URL)===false)
      throw new RuntimeException('FIELD_INVALID');
   }elseif($type==='text'){
    if(!is_string($value))throw new RuntimeException('FIELD_INVALID');
    $value=trim($value);
    if($value===''||strlen($value)>($field['max']??150))throw new RuntimeException('FIELD_INVALID');
   }else throw new RuntimeException('CONTRACT_INVALID');
   $validated[$key]=$value;
  }
  return $validated;
 }
}
