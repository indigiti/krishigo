<?php
declare(strict_types=1);
namespace KrishiGo\Production;

use PDOException;

/**
 * M21/M23 account-owned farm preferences, supplier review and provisional
 * produce quotation/order lifecycle. No real payment, dispatch, licence
 * certification, inventory escrow or customer message delivery.
 */
final class CommerceApi {
    public static function handles(string $path):bool {
        return $path==='/api/v1/me/farm-profile' ||
            str_starts_with($path,'/api/v1/suppliers/') ||
            str_starts_with($path,'/api/v1/admin/suppliers') ||
            str_starts_with($path,'/api/v1/trade/');
    }
    public static function dispatch(string $method,string $path,Repository $repo,?array $identity):never {
        $c=PlatformCommon::class;
        $user=$c::requireUser($identity);
        $uid=(int)$user['id'];
        if($path==='/api/v1/me/farm-profile'&&$method==='GET'){
            $record=$repo->one('SELECT district,preferred_language,crop_focus,updated_at FROM farmer_profiles WHERE user_id=?',[$uid]);
            \kg_json(200,['profile'=>$record,'owner_only'=>true]);
        }
        if($path==='/api/v1/me/farm-profile'&&$method==='PUT'){
            $b=$c::mutation(1024);
            $district=Validation::text($b,'district',100,2);
            $crop=Validation::text($b,'crop_focus',120,2);
            $language=Validation::choice($b,'preferred_language',['en','mr','hi']);
            $repo->exec('INSERT INTO farmer_profiles(user_id,district,preferred_language,crop_focus) VALUES (?,?,?,?)
               ON DUPLICATE KEY UPDATE district=VALUES(district),preferred_language=VALUES(preferred_language),crop_focus=VALUES(crop_focus)',
                [$uid,$district,$language,$crop]);
            \kg_json(200,['stored'=>true,'owner_only'=>true]);
        }
        if($path==='/api/v1/suppliers/profile'&&$method==='GET'){
            $row=$repo->one('SELECT id,business_name,district,license_reference,status,reviewed_at,created_at FROM supplier_profiles WHERE user_id=?',[$uid]);
            \kg_json(200,['profile'=>$row,'license_independently_verified'=>false]);
        }
        if($path==='/api/v1/suppliers/profile'&&$method==='POST'){
            $c::requireVerified($identity,['farmer','fpo','admin']);
            $b=$c::mutation(1400);
            $id=$c::uuid();
            $existing=$repo->one('SELECT id FROM supplier_profiles WHERE user_id=?',[$uid]);
            if($existing)\kg_json(409,['error'=>'supplier_profile_exists']);
            $name=Validation::text($b,'business_name',160,3);
            $district=Validation::text($b,'district',100,2);
            $licence=isset($b['license_reference'])&&$b['license_reference']!==''
                ?Validation::text($b,'license_reference',140):'';
            try{
                $repo->exec('INSERT INTO supplier_profiles (id,user_id,business_name,district,license_reference) VALUES (?,?,?,?,?)',
                    [$id,$uid,$name,$district,$licence]);
            }catch(PDOException $e){
                if($e->getCode()==='23000')\kg_json(409,['error'=>'supplier_profile_exists']);
                throw $e;
            }
            \kg_json(201,['id'=>$id,'status'=>'pending_review','license_verified'=>false,'external_publication'=>false]);
        }
        if($path==='/api/v1/admin/suppliers'&&$method==='GET'){
            $c::requireVerified($identity,['admin']);
            $rows=$repo->all("SELECT id,business_name,district,license_reference,user_id,created_at
                  FROM supplier_profiles WHERE status='pending_review' ORDER BY created_at DESC LIMIT 40");
            \kg_json(200,['items'=>$rows,'independent_licence_lookup'=>false]);
        }
        if($method==='POST'&&preg_match('~^/api/v1/admin/suppliers/([0-9a-f-]{36})/review$~D',$path,$m)){
            $c::requireVerified($identity,['admin']);
            $id=$c::id($m[1]);$b=$c::mutation(800);
            $decision=Validation::choice($b,'decision',['approve','reject']);
            $reason=$c::reviewerReason($b);
            $repo->transaction(function()use($repo,$id,$uid,$decision,$reason,$c):void{
                $row=$repo->one('SELECT status,user_id FROM supplier_profiles WHERE id=? FOR UPDATE',[$id]);
                if(!$row)\kg_json(404,['error'=>'not_found']);
                if($row['status']!=='pending_review')\kg_json(409,['error'=>'already_reviewed']);
                if((int)$row['user_id']===$uid)\kg_json(409,['error'=>'independent_review_required']);
                $repo->exec('UPDATE supplier_profiles SET status=?,reviewed_at=UTC_TIMESTAMP(),reviewed_by=?,review_reason=? WHERE id=?',[
                    $decision==='approve'?'reviewed':'rejected',$uid,$reason,$id]);
                $c::audit($repo,$uid,$decision,'supplier_profile',$id,$reason);
            });
            \kg_json(200,['status'=>$decision==='approve'?'reviewed':'rejected',
                'regulatory_licence_verified'=>false,'trade_enabled'=>false]);
        }

        if($path==='/api/v1/trade/quotes/mine'&&$method==='GET'){
            $rows=$repo->all('SELECT q.id,q.enquiry_id,q.listing_id,q.quantity_kg,q.total_inr,q.terms,q.expires_at,q.status,
               q.seller_id,q.buyer_id,q.created_at FROM trade_quotes q
               WHERE q.seller_id=? OR q.buyer_id=? ORDER BY q.created_at DESC LIMIT 50',[$uid,$uid]);
            \kg_json(200,['items'=>$rows,'provisional_only'=>true,'payment_enabled'=>false]);
        }
        if($path==='/api/v1/trade/quotes'&&$method==='POST'){
            $c::requireVerified($identity,['farmer','fpo','admin']);
            $b=$c::mutation(1500);
            $str=$b['enquiry_id']??null;
            if(!is_int($str)&&!is_string($str))\kg_json(422,['error'=>'invalid_enquiry_id']);
            if(!preg_match('/^[1-9][0-9]{0,16}$/D',(string)$str))\kg_json(422,['error'=>'invalid_enquiry_id']);
            $enquiryId=(int)$str;
            $amount=Validation::number($b,'total_inr',0.01,100000000);
            $terms=Validation::text($b,'terms',600,12);
            $expires=$c::date($b,'expires_on',true);
            if((strtotime($expires)-time())>90*86400)\kg_json(422,['error'=>'expiry_too_far']);
            $row=$repo->one('SELECT e.listing_id,e.buyer_id,e.quantity_kg,l.seller_id,l.status,l.quantity_kg AS available
                      FROM enquiries e JOIN listings l ON l.id=e.listing_id WHERE e.id=?',[$enquiryId]);
            if(!$row||$row['status']!=='published')\kg_json(404,['error'=>'published_enquiry_not_found']);
            if((int)$row['seller_id']!==$uid)\kg_json(403,['error'=>'not_listing_owner']);
            if((int)$row['buyer_id']===$uid)\kg_json(409,['error'=>'self_quote_forbidden']);
            if($c::moneyCent((string)$row['quantity_kg'])>$c::moneyCent((string)$row['available']))
                \kg_json(409,['error'=>'enquiry_exceeds_available_lot']);
            $repo->throttle('quote-user',(string)$uid,35,3600);
            $id=$c::uuid();
            try{
                $repo->exec("INSERT INTO trade_quotes(id,enquiry_id,listing_id,seller_id,buyer_id,quantity_kg,total_inr,terms,expires_at)
                       VALUES (?,?,?,?,?,?,?,?,?)",[
                    $id,$enquiryId,$row['listing_id'],$uid,$row['buyer_id'],$row['quantity_kg'],$amount,$terms,$expires.' 23:59:59']);
            }catch(PDOException $e){
                if($e->getCode()==='23000')\kg_json(409,['error'=>'quote_already_exists']);
                throw $e;
            }
            $c::userNotification($repo,(int)$row['buyer_id'],'trade','Provisional quote created',
                 'A seller has prepared a quotation. Review the terms before accepting.');
            \kg_json(201,['id'=>$id,'status'=>'offered','provisional_only'=>true,
                 'payment_requested'=>false,'delivery_sent'=>false]);
        }
        if($method==='POST'&&preg_match('~^/api/v1/trade/quotes/([0-9a-f-]{36})/decision$~D',$path,$m)){
            $c::requireVerified($identity,['buyer','fpo','admin']);
            $id=$c::id($m[1]);$b=$c::mutation(400);
            $decision=Validation::choice($b,'decision',['accept','reject']);
            $orderId=$decision==='accept'?$c::uuid():null;
            $repo->transaction(function()use($repo,$uid,$id,$decision,$orderId,$c):void{
                // Lock listing first in every acceptance to serialize reservations.
                $ref=$repo->one('SELECT listing_id FROM trade_quotes WHERE id=?',[$id]);
                if(!$ref)\kg_json(404,['error'=>'not_found']);
                $listing=$repo->one('SELECT id,status,quantity_kg FROM listings WHERE id=? FOR UPDATE',[$ref['listing_id']]);
                if(!$listing||$listing['status']!=='published')\kg_json(409,['error'=>'listing_not_available']);
                $q=$repo->one('SELECT * FROM trade_quotes WHERE id=? FOR UPDATE',[$id]);
                if(!$q||$q['status']!=='offered')\kg_json(409,['error'=>'quote_not_open']);
                if((int)$q['buyer_id']!==$uid)\kg_json(403,['error'=>'not_quote_recipient']);
                if(strtotime((string)$q['expires_at'])<=time())\kg_json(409,['error'=>'quote_expired']);
                if($decision==='accept'){
                    $used=$repo->one("SELECT COALESCE(SUM(q2.quantity_kg),0) AS reserved FROM trade_orders o
                           JOIN trade_quotes q2 ON o.quote_id=q2.id
                           WHERE q2.listing_id=? AND o.status IN ('awaiting_seller_confirmation','confirmed_record')",[$listing['id']]);
                    if($c::moneyCent((string)$q['quantity_kg'])+$c::moneyCent((string)$used['reserved'])>
                        $c::moneyCent((string)$listing['quantity_kg']))
                        \kg_json(409,['error'=>'lot_quantity_already_reserved']);
                    $repo->exec("UPDATE trade_quotes SET status='accepted',accepted_at=UTC_TIMESTAMP() WHERE id=?",[$id]);
                    $repo->exec("INSERT INTO trade_orders(id,quote_id,seller_id,buyer_id) VALUES (?,?,?,?)",[
                        $orderId,$id,$q['seller_id'],$uid]);
                    $c::userNotification($repo,(int)$q['seller_id'],'trade','Quote accepted for review',
                       'Buyer accepted a provisional quote. Seller confirmation is still needed.');
                } else $repo->exec("UPDATE trade_quotes SET status='rejected' WHERE id=?",[$id]);
                $c::audit($repo,$uid,$decision,'trade_quote',$id,'Buyer decision; no payment or delivery');
            });
            \kg_json(200,['id'=>$id,'status'=>$decision==='accept'?'accepted':'rejected',
                'order_id'=>$orderId,'payment_enabled'=>false,'fulfilment_started'=>false]);
        }
        if($path==='/api/v1/trade/orders/mine'&&$method==='GET'){
            $rows=$repo->all('SELECT o.id,o.quote_id,o.seller_id,o.buyer_id,o.status,o.created_at,
                     q.quantity_kg,q.total_inr,q.terms FROM trade_orders o
                     JOIN trade_quotes q ON q.id=o.quote_id
                     WHERE o.buyer_id=? OR o.seller_id=? ORDER BY o.created_at DESC LIMIT 50',[$uid,$uid]);
            \kg_json(200,['items'=>$rows,'provisional_only'=>true,'payment_enabled'=>false]);
        }
        if($method==='POST'&&preg_match('~^/api/v1/trade/orders/([0-9a-f-]{36})/confirm$~D',$path,$m)){
            $c::requireVerified($identity,['farmer','fpo','admin']);
            $id=$c::id($m[1]);$c::mutation(256);
            $repo->transaction(function()use($repo,$uid,$id,$c):void{
                $row=$repo->one('SELECT status,seller_id,buyer_id FROM trade_orders WHERE id=? FOR UPDATE',[$id]);
                if(!$row)\kg_json(404,['error'=>'not_found']);
                if((int)$row['seller_id']!==$uid)\kg_json(403,['error'=>'not_order_seller']);
                if($row['status']!=='awaiting_seller_confirmation')
                    \kg_json(409,['error'=>'order_already_decided']);
                $repo->exec("UPDATE trade_orders SET status='confirmed_record',confirmed_at=UTC_TIMESTAMP() WHERE id=?",[$id]);
                $c::audit($repo,$uid,'confirm','trade_order',$id,'Provisional order record confirmed, no dispatch');
                $c::userNotification($repo,(int)$row['buyer_id'],'trade','Provisional order confirmed',
                    'Seller confirmed the internal order record; external fulfilment is not connected.');
            });
            \kg_json(200,['id'=>$id,'status'=>'confirmed_record','payment_enabled'=>false,
                'shipping_enabled'=>false,'contract_enforcement'=>false]);
        }
        \kg_json(404,['error'=>'not_found']);
    }
}
