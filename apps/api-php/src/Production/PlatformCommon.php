<?php
declare(strict_types=1);
namespace KrishiGo\Production;

use DateTimeImmutable;
use DateTimeZone;

/** Shared authorization, UUIDv7, provenance and consent gates for M20–M25. */
final class PlatformCommon {
    public static function requireUser(?array $identity, array $roles=[]): array {
        if (!$identity || ($identity['status']??'')!=='active') \kg_json(401,['error'=>'unauthorized']);
        if ($roles && !in_array($identity['role'], $roles,true)) \kg_json(403,['error'=>'permission_denied']);
        return $identity;
    }
    public static function requireVerified(?array $identity, array $roles=[]): array {
        $user=self::requireUser($identity,$roles);
        if (empty($user['verified_at'])) \kg_json(403,['error'=>'staff_identity_review_required']);
        return $user;
    }
    public static function mutation(int $max=8192): array {
        \kg_check_csrf();
        return \kg_json_input($max);
    }
    public static function uuid(): string {
        $ms=(int)floor(microtime(true)*1000);
        $bytes=pack('Nn',intdiv($ms,65536),$ms%65536).random_bytes(10);
        $bytes[6]=chr((ord($bytes[6])&0x0f)|0x70);
        $bytes[8]=chr((ord($bytes[8])&0x3f)|0x80);
        $hex=bin2hex($bytes);
        return substr($hex,0,8).'-'.substr($hex,8,4).'-'.substr($hex,12,4).'-'.substr($hex,16,4).'-'.substr($hex,20,12);
    }
    public static function id(string $value):string {
        if(!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/D',$value))
            \kg_json(404,['error'=>'not_found']);
        return $value;
    }
    public static function sourceUrl(array $input,string $field='source_url'):string {
        $value=Validation::text($input,$field,500,12);
        $parts=parse_url($value);
        if (!is_array($parts)||($parts['scheme']??'')!=='https'||empty($parts['host'])||
            isset($parts['user'])||isset($parts['pass'])||isset($parts['fragment'])||
            preg_match('/[\s\x00-\x1f]/',$value) ||
            filter_var($value,FILTER_VALIDATE_URL)===false)
            \kg_json(422,['error'=>'https_original_source_required']);
        // The URL is saved as text only; the backend NEVER fetches arbitrary user URLs.
        return $value;
    }
    public static function date(array $input,string $key,bool $future=false):string {
        $value=Validation::text($input,$key,10,10);
        if(!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/D',$value,$m)||
            !checkdate((int)$m[2],(int)$m[3],(int)$m[1])||
            ($future?$value<=gmdate('Y-m-d'):$value>gmdate('Y-m-d')))
            \kg_json(422,['error'=>'invalid_'.$key]);
        return $value;
    }
    public static function audit(Repository $repo,int $actor,string $action,string $kind,string $id,string $reason):void {
        $repo->exec('INSERT INTO operations_audit (id,actor_id,action,resource_type,resource_uuid,reason) VALUES (?,?,?,?,?,?)',
            [self::uuid(),$actor,$action,$kind,$id,$reason]);
    }
    public static function reviewerReason(array $input):string {
        return Validation::text($input,'reason',400,12);
    }
    public static function sourceApproved(Repository $repo,string $id):void {
        $row=$repo->one('SELECT status FROM knowledge_sources WHERE id=?',[$id]);
        if(!$row||$row['status']!=='approved')\kg_json(409,['error'=>'approved_source_required']);
    }
    public static function userNotification(Repository $repo,int $userId,string $topic,string $title,string $message):void {
        // Explicit opt-in to in-app notifications; NO SMS, email or WhatsApp send path.
        $consent=$repo->one('SELECT opted_in FROM notification_preferences WHERE user_id=? AND topic=? AND channel=?',
            [$userId,$topic,'in_app']);
        if (!$consent||(int)$consent['opted_in']!==1)return;
        $repo->insert('INSERT INTO notification_events(id,user_id,topic,title,description) VALUES (?,?,?,?,?)',
            [self::uuid(),$userId,$topic,$title,$message]);
    }
    public static function moneyCent(string $decimal):int {
        if(!preg_match('/^(?:0|[1-9][0-9]{0,11})\.[0-9]{2}$/D',$decimal))
           \kg_json(422,['error'=>'invalid_decimal']);
        [$major,$minor]=explode('.',$decimal);
        return (int)$major*100+(int)$minor;
    }
    public static function reply(int $status,array $payload):never {\kg_json($status,$payload);}
}
