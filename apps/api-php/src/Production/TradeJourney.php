<?php
declare(strict_types=1);
namespace KrishiGo\Production;

/**
 * M26 internal trading lifecycle, with strict participant access and reservation
 * release on cancellation. No external contract, payment or logistics action.
 */
final class TradeJourney {
    public static function handles(string $path):bool {
        return $path==='/api/v1/trade/dashboard'
            || (bool)preg_match('~^/api/v1/trade/orders/[0-9a-f-]{36}/(?:timeline|cancel)$~D',$path);
    }

    /** Must be invoked within the same transaction as the related state change. */
    public static function event(
        Repository $repo,string $quoteId,?string $orderId,int $actor,string $kind,string $description
    ):void {
        $repo->exec(
            'INSERT INTO trade_activity(id,quote_id,order_id,actor_id,event_type,description) VALUES (?,?,?,?,?,?)',
            [PlatformCommon::uuid(),$quoteId,$orderId,$actor,$kind,$description]
        );
    }

    public static function dispatch(string $method,string $path,Repository $repo,?array $identity):never {
        $c=PlatformCommon::class;
        $user=$c::requireUser($identity);
        $uid=(int)$user['id'];
        if($path==='/api/v1/trade/dashboard'&&$method==='GET'){
            // Only public, moderated lots and caller-owned private records.
            $public=$repo->all("SELECT id,crop,district,quantity_kg,price_per_kg,description,created_at
                    FROM listings WHERE status='published' ORDER BY id DESC LIMIT 30");
            $lots=$repo->all('SELECT id,crop,district,quantity_kg,price_per_kg,status,created_at
                    FROM listings WHERE seller_id=? ORDER BY id DESC LIMIT 30',[$uid]);
            $enquiries=$repo->all('SELECT e.id,e.listing_id,e.buyer_id,l.seller_id,e.quantity_kg,
                   e.message,e.status,e.created_at,l.crop,l.district
                   FROM enquiries e JOIN listings l ON l.id=e.listing_id
                   WHERE e.buyer_id=? OR l.seller_id=? ORDER BY e.id DESC LIMIT 40',[$uid,$uid]);
            $quotes=$repo->all('SELECT q.id,q.enquiry_id,q.listing_id,q.seller_id,q.buyer_id,
                     q.quantity_kg,q.total_inr,q.terms,q.expires_at,q.status,q.created_at,
                     l.crop,l.district
                   FROM trade_quotes q JOIN listings l ON l.id=q.listing_id
                   WHERE q.seller_id=? OR q.buyer_id=? ORDER BY q.created_at DESC LIMIT 40',[$uid,$uid]);
            $orders=$repo->all('SELECT o.id,o.quote_id,o.seller_id,o.buyer_id,o.status,o.created_at,
                     o.confirmed_at,o.cancelled_at,q.quantity_kg,q.total_inr,q.terms,q.listing_id,
                     l.crop,l.district
                   FROM trade_orders o JOIN trade_quotes q ON q.id=o.quote_id
                   JOIN listings l ON l.id=q.listing_id
                   WHERE o.buyer_id=? OR o.seller_id=? ORDER BY o.created_at DESC LIMIT 40',[$uid,$uid]);
            \kg_json(200,[
                'published_listings'=>$public,
                'my_listings'=>$lots,
                'enquiries'=>$enquiries,
                'quotes'=>$quotes,
                'orders'=>$orders,
                'verified_for_restricted_actions'=>!empty($user['verified_at']),
                'internal_workflow_only'=>true,'payments_enabled'=>false,
                'shipping_enabled'=>false,'external_messages_sent'=>false
            ]);
        }

        if(preg_match('~^/api/v1/trade/orders/([0-9a-f-]{36})/timeline$~D',$path,$m)){
            if($method!=='GET')\kg_json(405,['error'=>'method_not_allowed']);
            $id=$c::id($m[1]);
            $row=$repo->one('SELECT o.id,o.quote_id,o.seller_id,o.buyer_id,o.status,
                  o.created_at AS order_created,q.enquiry_id,q.listing_id,
                  q.created_at AS quote_created,e.created_at AS enquiry_created,
                  l.created_at AS listing_created
                  FROM trade_orders o JOIN trade_quotes q ON q.id=o.quote_id
                  JOIN enquiries e ON e.id=q.enquiry_id
                  JOIN listings l ON l.id=q.listing_id WHERE o.id=?',[$id]);
            if(!$row)\kg_json(404,['error'=>'not_found']);
            if((int)$row['seller_id']!==$uid&&(int)$row['buyer_id']!==$uid)
                \kg_json(404,['error'=>'not_found']);
            $events=$repo->all('SELECT id,event_type,description,created_at
                     FROM trade_activity WHERE quote_id=? ORDER BY created_at ASC,id ASC LIMIT 40',
                [$row['quote_id']]);
            $timeline=[
              ['event_type'=>'listing_created','description'=>'Produce listing entered; editorial approval is separate.',
                 'created_at'=>$row['listing_created']],
              ['event_type'=>'enquiry_submitted','description'=>'Buyer enquiry recorded in the application.',
                 'created_at'=>$row['enquiry_created']]
            ];
            foreach($events as $event)$timeline[]=$event;
            usort($timeline,fn(array $a,array $b)=>strcmp((string)$a['created_at'],(string)$b['created_at']));
            \kg_json(200,['order_id'=>$id,'status'=>$row['status'],
                'events'=>array_slice($timeline,0,42),
                'provisional_only'=>true,'external_fulfilment'=>false]);
        }

        if(preg_match('~^/api/v1/trade/orders/([0-9a-f-]{36})/cancel$~D',$path,$m)){
            if($method!=='POST')\kg_json(405,['error'=>'method_not_allowed']);
            $c::requireVerified($identity,['farmer','buyer','fpo','admin']);
            $id=$c::id($m[1]);
            $body=$c::mutation(800);
            $reason=Validation::text($body,'reason',400,12);
            $newState=$repo->transaction(function()use($repo,$c,$id,$uid,$reason):string{
                // Lock the listing first, matching quote-acceptance lock ordering.
                $ref=$repo->one('SELECT q.listing_id FROM trade_orders o
                    JOIN trade_quotes q ON q.id=o.quote_id WHERE o.id=?',[$id]);
                if(!$ref)\kg_json(404,['error'=>'not_found']);
                $lot=$repo->one('SELECT id FROM listings WHERE id=? FOR UPDATE',[$ref['listing_id']]);
                if(!$lot)\kg_json(409,['error'=>'listing_missing']);
                $order=$repo->one('SELECT id,quote_id,seller_id,buyer_id,status
                     FROM trade_orders WHERE id=? FOR UPDATE',[$id]);
                if(!$order)\kg_json(404,['error'=>'not_found']);
                $seller=(int)$order['seller_id']===$uid;
                $buyer=(int)$order['buyer_id']===$uid;
                if(!$seller&&!$buyer)\kg_json(404,['error'=>'not_found']);
                if(!in_array($order['status'],['awaiting_seller_confirmation','confirmed_record'],true))
                    \kg_json(409,['error'=>'order_not_cancellable']);
                $state=$seller?'cancelled_by_seller':'cancelled_by_buyer';
                $repo->exec('UPDATE trade_orders SET status=?,cancelled_at=UTC_TIMESTAMP() WHERE id=?',[$state,$id]);
                self::event($repo,$order['quote_id'],$id,$uid,'order_cancelled',$reason);
                $c::audit($repo,$uid,'cancel','trade_order',$id,$reason);
                $recipient=$seller?(int)$order['buyer_id']:(int)$order['seller_id'];
                $c::userNotification($repo,$recipient,'trade','Provisional order cancelled',
                     'An internal trade record was cancelled. No delivery or payment was initiated.');
                return $state;
            });
            \kg_json(200,['id'=>$id,'status'=>$newState,'reservation_released'=>true,
                'payments_enabled'=>false,'shipping_enabled'=>false,
                'external_messages_sent'=>false]);
        }
        \kg_json(404,['error'=>'not_found']);
    }
}
