<?php
declare(strict_types=1);
namespace KrishiGo\Production;

/**
 * M24/M25: consented in-app events, review-only OCR/crop case intake and
 * deterministic approved-document search. NO external OCR/AI/messaging.
 */
final class EngagementApi {
    public static function handles(string $path):bool {
        return $path==='/api/v1/platform/capabilities'||
            str_starts_with($path,'/api/v1/assistant/')||
            str_starts_with($path,'/api/v1/agronomy/')||
            str_starts_with($path,'/api/v1/me/notification-');
    }
    public static function dispatch(string $method,string $path,Repository $repo,?array $identity):never {
        $c=PlatformCommon::class;
        if($path==='/api/v1/platform/capabilities'&&$method==='GET'){
            \kg_json(200,['schema_revision'=>4,'platform_candidate'=>true,
                'verified_identity'=>false,'live_mandi_feed'=>false,'live_weather_feed'=>false,
                'live_scheme_feed'=>false,'registered_pesticide_catalogue'=>false,
                'real_ocr'=>false,'generative_ai'=>false,'expert_treatment_advice'=>false,
                'whatsapp_delivery'=>false,'email_delivery'=>false,'payments'=>false,
                'booking_or_dispatch'=>false,'source_review'=>true,
                'manually_reviewed_snapshots'=>true,'provisional_trade_records'=>true,
                'in_app_consent_events'=>true,'database_required'=>true,'production_module_policy'=>true,'owner_scoped_farm_fields'=>true]);
        }
        if($method==='GET'&&$path==='/api/v1/assistant/search'){
            $q=$_GET['q']??'';
            if(!is_string($q)||strlen($q)>100||strlen(trim($q))<2)
                \kg_json(422,['error'=>'invalid_search']);
            $term=trim($q);
            $rows=$repo->all("SELECT a.id,a.title,a.crop,a.topic,a.language,a.summary,
                       s.publisher,s.source_url,s.published_on,a.reviewed_at
                       FROM knowledge_articles a JOIN knowledge_sources s ON s.id=a.source_id
                       WHERE a.status='approved' AND s.status='approved'
                         AND (a.title LIKE ? OR a.crop LIKE ? OR a.summary LIKE ?)
                       ORDER BY a.reviewed_at DESC LIMIT 12",
                       array_fill(0,3,'%'.str_replace(['%','_','\\'],['\\%','\\_','\\\\'],$term).'%'));
            \kg_json(200,['matches'=>$rows,'answer'=>count($rows)?
                'Reviewed educational references are listed. Evaluate the original sources and consult a qualified specialist for treatment.':
                'No approved source in this library supports an answer. Escalate to a qualified specialist.',
                'generative_ai'=>false,'clinical_diagnosis'=>false,
                'pesticide_dosage'=>false,'label_matching'=>false]);
        }
        $user=$c::requireUser($identity);$uid=(int)$user['id'];
        if($path==='/api/v1/agronomy/mine'&&$method==='GET'){
            $rows=$repo->all('SELECT a.id,a.crop,a.observation,a.context_note,a.kind,
                 a.evidence_url,a.status,a.created_at,fc.field_id
                 FROM agronomy_intakes a LEFT JOIN farm_field_case_links fc ON fc.intake_id=a.id AND fc.owner_id=a.user_id
                 WHERE a.user_id=? ORDER BY a.created_at DESC LIMIT 40',[$uid]);
            \kg_json(200,['items'=>$rows,'private'=>true]);
        }
        if($path==='/api/v1/agronomy/intake'&&$method==='POST'){
            $b=$c::mutation(3000);
            $crop=Validation::text($b,'crop',100,2);
            $kind=Validation::choice($b,'kind',['plant_observation','label_transcription']);
            $observation=Validation::text($b,'observation',1200,12);
            $context=Validation::text($b,'context_note',600,8);
            $url=isset($b['evidence_url'])&&$b['evidence_url']!==''?
                $c::sourceUrl($b,'evidence_url'):null;
            $fieldId=null;
            if(isset($b['field_id'])&&$b['field_id']!=='')
                $fieldId=$c::id(Validation::text($b,'field_id',36,36));
            $repo->throttle('agronomy-intake',(string)$uid,20,3600);
            $id=$c::uuid();
            $repo->transaction(function()use($repo,$id,$uid,$crop,$observation,$context,$kind,$url,$fieldId,$c):void {
                if($fieldId!==null){
                    $field=$repo->one('SELECT status FROM farm_fields WHERE id=? AND owner_id=? FOR UPDATE',[$fieldId,$uid]);
                    if(!$field||$field['status']!=='active')\kg_json(404,['error'=>'field_not_found']);
                }
                $repo->exec('INSERT INTO agronomy_intakes(id,user_id,crop,observation,context_note,kind,evidence_url) VALUES (?,?,?,?,?,?,?)',[
                    $id,$uid,$crop,$observation,$context,$kind,$url]);
                if($fieldId!==null)$repo->exec('INSERT INTO farm_field_case_links(id,field_id,intake_id,owner_id) VALUES (?,?,?,?)',[
                    $c::uuid(),$fieldId,$id,$uid]);
            });
            \kg_json(201,['id'=>$id,'status'=>'pending_expert_review','field_id'=>$fieldId,
                'file_uploaded'=>false,'ocr_processed'=>false,'ai_diagnosis'=>false,
                'expert_contacted'=>false]);
        }
        if($path==='/api/v1/me/notification-preferences'&&$method==='GET'){
            $items=$repo->all('SELECT topic,channel,opted_in,updated_at FROM notification_preferences WHERE user_id=? ORDER BY topic',[$uid]);
            \kg_json(200,['items'=>$items,'delivery_channels'=>['in_app'],'external_delivery'=>false]);
        }
        if($path==='/api/v1/me/notification-preferences'&&$method==='PUT'){
            $b=$c::mutation(400);
            $topic=Validation::choice($b,'topic',['trade','content','regulatory','agronomy']);
            $channel=Validation::choice($b,'channel',['in_app']);
            if(!isset($b['opted_in'])||!is_bool($b['opted_in']))
                \kg_json(422,['error'=>'opted_in_boolean_required']);
            $value=$b['opted_in']?1:0;
            $repo->exec('INSERT INTO notification_preferences(user_id,topic,channel,opted_in) VALUES (?,?,?,?)
              ON DUPLICATE KEY UPDATE opted_in=VALUES(opted_in)',[$uid,$topic,$channel,$value]);
            \kg_json(200,['topic'=>$topic,'channel'=>$channel,'opted_in'=>(bool)$value,
                'external_messages_sent'=>false]);
        }
        if($path==='/api/v1/me/notification-events'&&$method==='GET'){
            // Retained in-app events are never used for outbound communication.
            $items=$repo->all('SELECT id,topic,title,description,status,created_at
                        FROM notification_events WHERE user_id=? ORDER BY created_at DESC LIMIT 30',[$uid]);
            \kg_json(200,['items'=>$items,'whatsapp_sent'=>false,'email_sent'=>false,
                'notifications_are_in_app_only'=>true]);
        }
        \kg_json(404,['error'=>'not_found']);
    }
}
