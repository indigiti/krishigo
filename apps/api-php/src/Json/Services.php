<?php
declare(strict_types=1);
namespace KrishiGo\Json;

use KrishiGo\Modules\Registry;
use RuntimeException;

/**
 * Staging domain contracts only. Browser-supplied ownership and moderation
 * states are ignored. No external integrations or real publishing.
 */
final class Services {
    public const MODULES = [
        'marketplace'=>2,'buyers'=>3,'community'=>4,
        'plant'=>21,'services'=>13,'editorial'=>5
    ];
    private const ROLES = [
        'marketplace'=>['farmer','fpo','admin'],
        'buyers'=>['buyer','fpo','admin'],
        'community'=>['farmer','buyer','fpo','editor','admin'],
        'plant'=>['farmer','fpo','admin'],
        'services'=>['farmer','fpo','admin'],
        'editorial'=>['editor','admin'],
    ];
    private const TEXT = [
        'marketplace'=>['crop'=>80,'district'=>80,'grade'=>50],
        'buyers'=>['crop'=>80,'district'=>80],
        'community'=>['topic'=>100,'body'=>600],
        'plant'=>['crop'=>80,'symptoms'=>600,'district'=>80],
        'services'=>['service_type'=>80,'district'=>80,'description'=>500],
        'editorial'=>['title'=>150,'summary'=>600,'category'=>35],
    ];

    public function __construct(private Store $store, private Registry $modules) {}

    public function assertEnabled(string $domain): void {
        $id=self::MODULES[$domain] ?? null;
        if($id===null)throw new RuntimeException('UNKNOWN_DOMAIN');
        $snapshot=$this->modules->snapshot();
        if(!$snapshot['configured'])throw new RuntimeException('MODULE_STORE_REQUIRED');
        foreach($snapshot['modules'] as $module) {
            if($module['id']===$id){
                if(!$module['enabled'])throw new RuntimeException('MODULE_DISABLED');
                return;
            }
        }
        throw new RuntimeException('MODULE_DISABLED');
    }

    public function allowWrite(string $domain, string $role): bool {
        return in_array($role, self::ROLES[$domain] ?? [], true);
    }

    public function validate(string $domain, array $input): array {
        $schema=self::TEXT[$domain] ?? null;
        if($schema===null)throw new RuntimeException('UNKNOWN_DOMAIN');
        $out=[];
        foreach($schema as $name=>$max) {
            $value=$input[$name]??null;
            if(!is_string($value))throw new RuntimeException('FIELD_INVALID');
            $value=trim($value);
            if($value===''||strlen($value)>$max)throw new RuntimeException('FIELD_INVALID');
            $out[$name]=$value;
        }
        if($domain==='marketplace'||$domain==='buyers') {
            $quantity=$input['quantity_kg']??null;
            if(!is_int($quantity)||$quantity<=0||$quantity>10000000)throw new RuntimeException('FIELD_INVALID');
            $out['quantity_kg']=$quantity;
        }
        if($domain==='marketplace') {
            $price=$input['price_per_kg']??null;
            if(!is_int($price)||$price<1||$price>1000000)throw new RuntimeException('FIELD_INVALID');
            $out['price_per_kg']=$price;
        }
        if($domain==='plant' && array_key_exists('followup_of',$input)) {
            if(!is_int($input['followup_of']) || $input['followup_of']<1)throw new RuntimeException('FIELD_INVALID');
            $out['followup_of']=$input['followup_of'];
        }
        if($domain==='editorial'&&!in_array($out['category'],['News','Guide','Scheme','Learning'],true))throw new RuntimeException('FIELD_INVALID');
        return $out;
    }

    public function health(): array {
        $state=$this->store->health();
        $modules=$this->modules->snapshot();
        foreach($state['domains'] as $key=>&$entry){
            $moduleId=self::MODULES[$key];
            $entry['module_id']=$moduleId;
            $entry['enabled']=false;
            foreach($modules['modules'] as $module)if($module['id']===$moduleId)$entry['enabled']=$module['enabled'];
        }
        return $state;
    }
}
