<?php
declare(strict_types=1);
namespace KrishiGo\Production;

/**
 * M20/M22 source-backed editorial content and manually submitted, source-linked
 * data snapshots. NEVER interprets submitted URLs as proof of authenticity,
 * fetches arbitrary URLs, or enables an official data feed by itself.
 */
final class KnowledgeApi {
    private const LANGUAGES=['en','mr','hi'];
    private const TOPICS=['crop_guide','pest_disease','nutrient','scheme','market','equipment','general'];
    private const DATA_DOMAINS=['mandi','weather','schemes','inputs','logistics'];

    public static function handles(string $path):bool {
        return str_starts_with($path,'/api/v1/knowledge/')||
            str_starts_with($path,'/api/v1/editor/knowledge/')||
            str_starts_with($path,'/api/v1/data/snapshots')||
            str_starts_with($path,'/api/v1/editor/data/snapshots');
    }

    public static function dispatch(string $method,string $path,Repository $repo,?array $identity):never {
        $c=PlatformCommon::class;
        if($method==='GET'&&$path==='/api/v1/knowledge/sources'){
            $items=$repo->all("SELECT id,title,publisher,source_url,jurisdiction,published_on,last_checked_at FROM knowledge_sources WHERE status='approved' ORDER BY created_at DESC LIMIT 50");
            \kg_json(200,['items'=>$items,'editor_reviewed'=>true,'registration_verified'=>false]);
        }
        if($method==='GET'&&$path==='/api/v1/knowledge/articles'){
            $lang=$_GET['language']??'en';$crop=$_GET['crop']??'';
            if(!is_string($lang)||!in_array($lang,self::LANGUAGES,true)||!is_string($crop)||strlen($crop)>100)
                \kg_json(422,['error'=>'invalid_filter']);
            $items=$repo->all("SELECT a.id,a.title,a.topic,a.crop,a.language,a.summary,a.revision,a.reviewed_at,
                     s.title AS source_title,s.source_url,s.publisher,s.published_on
                     FROM knowledge_articles a JOIN knowledge_sources s ON s.id=a.source_id
                     WHERE a.status='approved' AND s.status='approved' AND a.language=? AND (?='' OR a.crop=?)
                     ORDER BY a.reviewed_at DESC LIMIT 30",[$lang,$crop,$crop]);
            \kg_json(200,['items'=>$items,'reviewed_content_only'=>true,
                'agronomist_certification'=>false,'generative_ai'=>false]);
        }
        if($method==='GET'&&preg_match('~^/api/v1/knowledge/articles/([0-9a-f-]{36})$~D',$path,$m)){
            $id=$c::id($m[1]);
            $item=$repo->one("SELECT a.id,a.title,a.topic,a.crop,a.language,a.summary,a.revision,a.reviewed_at,
                       s.title AS source_title,s.source_url,s.publisher,s.published_on
                       FROM knowledge_articles a JOIN knowledge_sources s ON s.id=a.source_id
                       WHERE a.id=? AND a.status='approved' AND s.status='approved'",[$id]);
            if(!$item)\kg_json(404,['error'=>'not_found']);
            \kg_json(200,['item'=>$item,'expert_advice'=>false]);
        }
        if($method==='GET'&&$path==='/api/v1/data/snapshots'){
            $domain=$_GET['domain']??'';
            if(!is_string($domain)||!in_array($domain,self::DATA_DOMAINS,true))
               \kg_json(422,['error'=>'invalid_domain']);
            $items=$repo->all("SELECT d.id,d.domain,d.label,d.payload_json,d.observed_at,d.valid_until,
                       s.source_url,s.publisher
                       FROM source_data_snapshots d JOIN knowledge_sources s ON s.id=d.source_id
                       WHERE d.domain=? AND d.status='approved' AND s.status='approved'
                         AND d.valid_until>UTC_TIMESTAMP()
                       ORDER BY d.observed_at DESC LIMIT 30",[$domain]);
            foreach($items as &$row)$row['payload']=json_decode((string)$row['payload_json'],true);
            unset($row);foreach($items as &$row)unset($row['payload_json']);unset($row);
            \kg_json(200,['items'=>$items,'connector_live'=>false,'manual_reviewed_sources_only'=>true,
                'freshness_required'=>true,'official_provider_status'=>'not_verified']);
        }

        $actor=$c::requireVerified($identity,['editor','admin']);
        $userId=(int)$actor['id'];
        if($method==='GET'&&$path==='/api/v1/editor/knowledge/sources'){
            $items=$repo->all("SELECT id,title,publisher,source_url,jurisdiction,published_on,status,created_at
                       FROM knowledge_sources WHERE status='pending_review' ORDER BY created_at DESC LIMIT 50");
            \kg_json(200,['items'=>$items]);
        }
        if($method==='POST'&&$path==='/api/v1/editor/knowledge/sources'){
            $b=$c::mutation(2048);$id=$c::uuid();
            $published=isset($b['published_on'])&&$b['published_on']!==''?$c::date($b,'published_on'):null;
            $repo->insert('INSERT INTO knowledge_sources (id,title,publisher,source_url,jurisdiction,published_on,submitted_by) VALUES (?,?,?,?,?,?,?)',[
               $id,Validation::text($b,'title',180,5),Validation::text($b,'publisher',120,3),
               $c::sourceUrl($b),Validation::text($b,'jurisdiction',80,2),$published,$userId
            ]);
            \kg_json(201,['id'=>$id,'status'=>'pending_review','externally_verified'=>false]);
        }
        if($method==='POST'&&preg_match('~^/api/v1/editor/knowledge/sources/([0-9a-f-]{36})/review$~D',$path,$m)){
            $id=$c::id($m[1]);$b=$c::mutation(800);
            $decision=Validation::choice($b,'decision',['approve','reject']);$reason=$c::reviewerReason($b);
            $repo->transaction(function()use($repo,$id,$decision,$reason,$userId,$c):void{
                $row=$repo->one('SELECT status,submitted_by FROM knowledge_sources WHERE id=? FOR UPDATE',[$id]);
                if(!$row)\kg_json(404,['error'=>'not_found']);
                if($row['status']!=='pending_review')\kg_json(409,['error'=>'already_reviewed']);
                if((int)$row['submitted_by']===$userId)\kg_json(409,['error'=>'independent_review_required']);
                $repo->exec('UPDATE knowledge_sources SET status=?,reviewed_by=?,reviewed_at=UTC_TIMESTAMP(),last_checked_at=UTC_TIMESTAMP(),review_reason=? WHERE id=?',[
                    $decision==='approve'?'approved':'rejected',$userId,$reason,$id]);
                $c::audit($repo,$userId,$decision,'knowledge_source',$id,$reason);
            });
            \kg_json(200,['id'=>$id,'status'=>$decision==='approve'?'approved':'rejected',
                'external_source_authorization'=>false]);
        }
        if($method==='GET'&&$path==='/api/v1/editor/knowledge/articles'){
            $items=$repo->all("SELECT id,title,topic,crop,language,source_id,status,created_at
                        FROM knowledge_articles WHERE status='pending_review' ORDER BY created_at DESC LIMIT 50");
            \kg_json(200,['items'=>$items]);
        }
        if($method==='POST'&&$path==='/api/v1/editor/knowledge/articles'){
            $b=$c::mutation(4000);
            $source=$c::id(Validation::text($b,'source_id',36,36));$c::sourceApproved($repo,$source);
            $topic=Validation::choice($b,'topic',self::TOPICS);
            $language=Validation::choice($b,'language',self::LANGUAGES);
            $crop=Validation::text($b,'crop',100,2);$title=Validation::text($b,'title',180,5);
            $summary=Validation::text($b,'summary',2200,30);
            $previous=null;$revision=1;
            if(isset($b['supersedes_id'])&&$b['supersedes_id']!==''){
                $previous=$c::id(Validation::text($b,'supersedes_id',36,36));
                $prior=$repo->one('SELECT crop,topic,language,status,revision FROM knowledge_articles WHERE id=?',[$previous]);
                if(!$prior||$prior['status']!=='approved'||$prior['crop']!==$crop||$prior['topic']!==$topic||
                   $prior['language']!==$language)\kg_json(409,['error'=>'invalid_revision_predecessor']);
                $revision=(int)$prior['revision']+1;
            }
            $id=$c::uuid();
            $repo->insert('INSERT INTO knowledge_articles (id,source_id,supersedes_id,title,crop,topic,language,summary,revision,submitted_by) VALUES (?,?,?,?,?,?,?,?,?,?)',[
                $id,$source,$previous,$title,$crop,$topic,$language,$summary,$revision,$userId]);
            \kg_json(201,['id'=>$id,'revision'=>$revision,'status'=>'pending_review','published'=>false]);
        }
        if($method==='POST'&&preg_match('~^/api/v1/editor/knowledge/articles/([0-9a-f-]{36})/review$~D',$path,$m)){
            $id=$c::id($m[1]);$b=$c::mutation(800);
            $decision=Validation::choice($b,'decision',['approve','reject']);$reason=$c::reviewerReason($b);
            $repo->transaction(function()use($repo,$id,$decision,$reason,$userId,$c):void{
                $row=$repo->one('SELECT source_id,submitted_by,supersedes_id,status FROM knowledge_articles WHERE id=? FOR UPDATE',[$id]);
                if(!$row)\kg_json(404,['error'=>'not_found']);
                if($row['status']!=='pending_review')\kg_json(409,['error'=>'already_reviewed']);
                if((int)$row['submitted_by']===$userId)\kg_json(409,['error'=>'independent_review_required']);
                $c::sourceApproved($repo,(string)$row['source_id']);
                if($decision==='approve'&&$row['supersedes_id']){
                    $prior=$repo->one('SELECT status FROM knowledge_articles WHERE id=? FOR UPDATE',[$row['supersedes_id']]);
                    if(!$prior||$prior['status']!=='approved')\kg_json(409,['error'=>'revision_conflict']);
                    $repo->exec("UPDATE knowledge_articles SET status='superseded' WHERE id=?",[$row['supersedes_id']]);
                }
                $repo->exec('UPDATE knowledge_articles SET status=?,reviewed_by=?,reviewed_at=UTC_TIMESTAMP(),review_reason=? WHERE id=?',[
                    $decision==='approve'?'approved':'rejected',$userId,$reason,$id]);
                $c::audit($repo,$userId,$decision,'knowledge_article',$id,$reason);
            });
            \kg_json(200,['id'=>$id,'status'=>$decision==='approve'?'approved':'rejected',
               'agronomist_certified'=>false]);
        }

        if($method==='GET'&&$path==='/api/v1/editor/data/snapshots'){
            $items=$repo->all("SELECT id,domain,label,source_id,observed_at,valid_until,status
                     FROM source_data_snapshots WHERE status='pending_review' ORDER BY created_at DESC LIMIT 50");
            \kg_json(200,['items'=>$items]);
        }
        if($method==='POST'&&$path==='/api/v1/editor/data/snapshots'){
            $b=$c::mutation(3500);
            $domain=Validation::choice($b,'domain',self::DATA_DOMAINS);
            $source=$c::id(Validation::text($b,'source_id',36,36));
            $c::sourceApproved($repo,$source);
            $observed=$c::date($b,'observed_on');
            $valid=$c::date($b,'valid_until',true);
            if((strtotime($valid)-strtotime($observed))>31*86400)\kg_json(422,['error'=>'snapshot_horizon_exceeded']);
            $payload=$b['payload']??null;
            if(!is_array($payload)||array_is_list($payload)||count($payload)<1||count($payload)>12)
                \kg_json(422,['error'=>'invalid_snapshot_payload']);
            foreach($payload as $k=>$v){
                if(!is_string($k)||!preg_match('/^[a-z][a-z0-9_]{0,39}$/D',$k)||
                   (!is_string($v)&&!is_int($v)&&!is_bool($v))||
                   (is_string($v)&&strlen($v)>220))
                   \kg_json(422,['error'=>'invalid_snapshot_field']);
            }
            $json=json_encode($payload,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);
            if(strlen($json)>2400)\kg_json(422,['error'=>'snapshot_too_large']);
            $id=$c::uuid();
            $repo->insert('INSERT INTO source_data_snapshots (id,source_id,domain,label,payload_json,observed_at,valid_until,submitted_by) VALUES (?,?,?,?,?,?,?,?)',[
                $id,$source,$domain,Validation::text($b,'label',140,4),$json,$observed.' 00:00:00',$valid.' 23:59:59',$userId]);
            \kg_json(201,['id'=>$id,'status'=>'pending_review','live_provider_connected'=>false]);
        }
        if($method==='POST'&&preg_match('~^/api/v1/editor/data/snapshots/([0-9a-f-]{36})/review$~D',$path,$m)){
            $id=$c::id($m[1]);$b=$c::mutation(800);
            $decision=Validation::choice($b,'decision',['approve','reject']);$reason=$c::reviewerReason($b);
            $repo->transaction(function()use($repo,$id,$decision,$reason,$userId,$c):void{
                $row=$repo->one('SELECT status,source_id,submitted_by,valid_until FROM source_data_snapshots WHERE id=? FOR UPDATE',[$id]);
                if(!$row)\kg_json(404,['error'=>'not_found']);
                if($row['status']!=='pending_review')\kg_json(409,['error'=>'already_reviewed']);
                if((int)$row['submitted_by']===$userId)\kg_json(409,['error'=>'independent_review_required']);
                $c::sourceApproved($repo,$row['source_id']);
                if($decision==='approve'&&strtotime($row['valid_until'])<=time())\kg_json(409,['error'=>'expired_snapshot']);
                $repo->exec('UPDATE source_data_snapshots SET status=?,reviewed_by=?,reviewed_at=UTC_TIMESTAMP() WHERE id=?',[
                    $decision==='approve'?'approved':'rejected',$userId,$id]);
                $c::audit($repo,$userId,$decision,'source_snapshot',$id,$reason);
            });
            \kg_json(200,['id'=>$id,'status'=>$decision==='approve'?'approved':'rejected',
                'connected_provider'=>false]);
        }
        \kg_json(404,['error'=>'not_found']);
    }
}
