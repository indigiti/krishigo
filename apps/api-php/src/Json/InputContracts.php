<?php
declare(strict_types=1);
namespace KrishiGo\Json;

/** Fixed fields for module 11. Every object remains a staging draft. */
final class InputContracts {
    private const FIELDS = [
        'products' => 'name:text:120,category:category,composition:text:220,crop:text:90,registration_reference:text:140,source_url:url,checked_on:date',
        'sources' => 'title:text:140,source_url:url,published_on:date,claim:text:350',
        'soil' => 'crop:text:90,lab:text:140,sample_date:date,measurement:text:80,value:text:80,unit:text:80,note:text:300',
        'applications' => 'crop:text:100,product:text:120,applied_on:date,amount:text:90,unit:text:90,note:text:260',
        'plans' => 'crop:text:100,lab_reference:text:150,nutrient:text:80,target_amount:decimal,target_unit:text:70,review_question:text:300',
        'suppliers' => 'supplier:text:140,district:text:100,license_reference:text:140,license_source:url,checked_on:date',
        'offers' => 'supplier:text:140,product:text:140,package:text:100,quoted_price_inr:decimal,availability:availability,checked_on:date',
        'enquiries' => 'product:text:120,district:text:100,quantity:text:100,question:text:350',
        'ocr' => 'product:text:120,transcription:text:650,reference:text:120,question:text:250',
        'regulatory' => 'title:text:160,source_url:url,published_on:date,category:text:120,summary:text:350',
        'recalls' => 'product:text:140,batch:text:100,source_url:url,notice_on:date,reason:text:300',
        'expert' => 'crop:text:100,symptoms:text:250,stage:text:100,context:text:450'
    ];
    private const OPTIONS = [
      'category'=>['insecticide','fungicide','herbicide','biopesticide','biofertilizer','water_soluble_fertilizer','micronutrient','secondary_nutrient','soil_amendment','other'],
      'availability'=>['unknown','in_stock','on_request','out_of_stock']
    ];
    private const PRIVATE_KINDS = ['soil','applications','plans','enquiries','ocr','expert'];
    public static function kinds():array {return array_keys(self::FIELDS);}
    public static function isPrivate(string $kind):bool {return in_array($kind,self::PRIVATE_KINDS,true);}
    public static function fields(string $kind):array {
        if(!isset(self::FIELDS[$kind]))\kg_json(404,['error'=>'unknown_input_kind']);
        $fields=[];
        foreach(explode(',',self::FIELDS[$kind]) as $part){
            [$name,$type,$limit]=array_pad(explode(':',$part),3,null);
            $fields[]=['key'=>$name,'label'=>ucwords(str_replace('_',' ',$name)),
                'type'=>$type,'max'=>$limit!==null?(int)$limit:($type==='url'?300:700),
                'options'=>self::OPTIONS[$type]??null];
        }
        return $fields;
    }
    public static function validate(string $kind,array $values):array {
        $fields=self::fields($kind);
        if(count($values)!==count($fields)||count(array_diff(array_keys($values),array_column($fields,'key')))!==0)
            \kg_json(422,['error'=>'unexpected_input_fields']);
        $out=[];
        foreach($fields as $field){
            $key=$field['key'];$value=$values[$key]??null;
            if(!is_string($value))\kg_json(422,['error'=>'field_not_text','field'=>$key]);
            $value=trim($value);
            if($value===''||strlen($value)>$field['max'])\kg_json(422,['error'=>'field_invalid','field'=>$key]);
            if(isset(self::OPTIONS[$field['type']])&&!in_array($value,self::OPTIONS[$field['type']],true))
                \kg_json(422,['error'=>'invalid_choice','field'=>$key]);
            if($field['type']==='url'&&
              (!str_starts_with($value,'https://')||filter_var($value,FILTER_VALIDATE_URL)===false||
               preg_match('~^https://[^/?#@[:space:]]+(?:[/?#][^[:space:]]*)?$~D',$value)!==1))
                \kg_json(422,['error'=>'https_source_required','field'=>$key]);
            if($field['type']==='decimal'&&(!preg_match('/^(?:0|[1-9][0-9]{0,8})(?:\.[0-9]{1,3})?$/D',$value)||(float)$value<=0))
                \kg_json(422,['error'=>'positive_decimal_required','field'=>$key]);
            if($field['type']==='date'){
                if(!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/D',$value,$date)||
                    !checkdate((int)($date[2]??0),(int)($date[3]??0),(int)($date[1]??0))||
                    $value>gmdate('Y-m-d'))\kg_json(422,['error'=>'invalid_date','field'=>$key]);
            }
            $out[$key]=$value;
        }
        return $out;
    }
}
