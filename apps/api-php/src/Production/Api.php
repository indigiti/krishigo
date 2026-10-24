<?php
declare(strict_types=1);
namespace KrishiGo\Production;

use PDOException;
use Throwable;

/** Production-mode application service / HTTP dispatch boundary; staging never invokes this router. */
final class Api
{
    private function __construct(private readonly Repository $repo) {}

    public static function dispatch(string $method, string $path): never
    {
        try {
            if (!\kg_secure_transport() && $path !== '/healthz') \kg_json(403, ['error' => 'https_required']);
            if ($path === '/healthz' && $method === 'GET') \kg_json(200, ['ok' => true, 'service' => 'krishigo-api', 'mode' => 'production']);
            $self = new self(new Repository(Connection::open()));
            $self->handle($method, $path);
        } catch (PDOException $e) {
            error_log('KrishiGo database request failed: ' . $e->getCode());
            \kg_json(503, ['error' => 'service_unavailable']);
        } catch (Throwable $e) {
            error_log('KrishiGo production exception: ' . get_class($e));
            \kg_json(503, ['error' => 'service_unavailable']);
        }
    }
    private function response(int $status, array $body): never { \kg_json($status, $body); }
    private function current(): ?array
    {
        \kg_begin_session();
        $id = $_SESSION['prod_user_id'] ?? null;
        if (!is_int($id) || $id <= 0) return null;
        return $this->repo->one('SELECT id,display_name,email,role,status,verified_at FROM users WHERE id=?', [$id]);
    }
    private function requireUser(array $roles = []): array
    {
        $user = $this->current();
        if (!$user || $user['status'] !== 'active') $this->response(401, ['error' => 'unauthorized']);
        if ($roles && !in_array($user['role'], $roles, true)) $this->response(403, ['error' => 'permission_denied']);
        return $user;
    }
    private function authorizedId(string $id): int
    {
        if (!preg_match('/^[1-9][0-9]{0,17}$/D', $id)) $this->response(404, ['error' => 'not_found']);
        return (int)$id;
    }
    private function cursor(): int
    {
        $value = $_GET['before'] ?? null;
        if ($value === null) return PHP_INT_MAX;
        if (!is_string($value) || !preg_match('/^[1-9][0-9]{0,17}$/D', $value)) $this->response(422, ['error' => 'invalid_cursor']);
        return (int)$value;
    }
    private function input(): array { return \kg_json_input(8192); }
    private function mutation(): array { \kg_check_csrf(); return $this->input(); }
    private function logAudit(int $actor, string $action, string $kind, int $id, string $old, string $new, string $reason): void
    {
        $this->repo->exec('INSERT INTO audit_events (actor_id,action,resource_type,resource_id,old_state,new_state,reason) VALUES (?,?,?,?,?,?,?)', [$actor,$action,$kind,$id,$old,$new,$reason]);
    }
    private function handle(string $method, string $path): never
    {
        if ($method === 'OPTIONS') $this->response(405, ['error' => 'cross_origin_not_supported']);
        if ($method === 'GET' && $path === '/api/v1/status') {
            $this->response(200, ['ok'=>true,'mode'=>'production','database'=>'required','fixture_data'=>false,'plant_diagnosis'=>false]);
        }
        if ($method === 'GET' && $path === '/api/v1/auth/csrf') $this->response(200, ['csrf_token'=>\kg_csrf_token()]);
        if ($method === 'GET' && $path === '/api/v1/auth/me') $this->response(200, ['identity'=>$this->current()]);
        if ($method === 'POST' && $path === '/api/v1/auth/register') $this->register($this->mutation());
        if ($method === 'POST' && $path === '/api/v1/auth/login') $this->login($this->mutation());
        if ($method === 'POST' && $path === '/api/v1/auth/logout') {
            \kg_check_csrf(); \kg_begin_session(); $_SESSION = []; session_regenerate_id(true);
            $this->response(200, ['ok'=>true]);
        }
        $entities = [
            '/api/v1/marketplace/listings'=>['table'=>'listings','roles'=>['farmer','fpo','admin'],'owner'=>'seller_id'],
            '/api/v1/buyers/requirements'=>['table'=>'buyer_requirements','roles'=>['buyer','fpo','admin'],'owner'=>'buyer_id'],
            '/api/v1/community/posts'=>['table'=>'community_posts','roles'=>['farmer','buyer','fpo','admin'],'owner'=>'author_id'],
            '/api/v1/plant-cases'=>['table'=>'plant_cases','roles'=>['farmer','fpo','admin'],'owner'=>'owner_id'],
        ];
        foreach ($entities as $route=>$config) {
            if ($path === $route && $method === 'GET') $this->listPublicOrMine($config);
            if ($path === $route && $method === 'POST') $this->create($config, $this->mutation());
            if ($path === $route.'/mine' && $method === 'GET') $this->listOwned($config);
        }
        if ($method === 'GET' && preg_match('~^/api/v1/marketplace/listings/([1-9][0-9]{0,17})$~D', $path, $match)) {
            $this->listingDetail($this->authorizedId($match[1]));
        }
        if ($method === 'POST' && $path === '/api/v1/enquiries') $this->enquire($this->mutation());
        if ($method === 'GET' && $path === '/api/v1/enquiries/mine') {
            $user=$this->requireUser();
            $id=(int)$user['id'];
            $this->response(200,$this->repo->all('SELECT e.id,e.listing_id,e.buyer_id,e.quantity_kg,e.message,e.status,e.created_at FROM enquiries e JOIN listings l ON l.id=e.listing_id WHERE e.buyer_id=? OR l.seller_id=? ORDER BY e.id DESC LIMIT 50',[$id,$id]));
        }
        if ($method === 'GET' && $path === '/api/v1/admin/review-cases') $this->reviewCases();
        if ($method === 'POST' && preg_match('~^/api/v1/admin/review-cases/(listing|requirement|post)/([1-9][0-9]{0,17})/decision$~D', $path,$m)) {
            $this->decide($m[1],$this->authorizedId($m[2]),$this->mutation());
        }
        if ($method === 'POST' && preg_match('~^/api/v1/admin/users/([1-9][0-9]{0,17})/verify$~D', $path,$m)) {
            $this->verifyUser($this->authorizedId($m[1]),$this->mutation());
        }
        $this->response(404, ['error'=>'not_found']);
    }
    private function register(array $input): never
    {
        $name=Validation::text($input,'display_name',100,2);
        $email=Validation::email($input);
        $password=Validation::text($input,'password',200,12);
        $role=Validation::choice($input,'role',['farmer','buyer','fpo']);
        if (strlen($password) < 12 || strlen($password) > 200) $this->response(422,['error'=>'invalid_password']);
        $ip=(string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
        $this->repo->throttle('register-ip',$ip,5,3600);
        $this->repo->throttle('register-email',$email,3,3600);
        if ($this->repo->one('SELECT id FROM users WHERE email=?',[$email])) $this->response(409,['error'=>'account_exists']);
        try {
            $id=$this->repo->insert('INSERT INTO users (display_name,email,password_hash,role) VALUES (?,?,?,?)',[$name,$email,password_hash($password,PASSWORD_DEFAULT),$role]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') $this->response(409, ['error'=>'account_exists']);
            throw $e;
        }
        $this->response(201,['id'=>$id,'role'=>$role,'verified'=>false,'message'=>'account_created_pending_verification']);
    }
    private function login(array $input): never
    {
        $email=Validation::email($input);
        $password=$input['password'] ?? null;
        if (!is_string($password) || strlen($password)>200) $this->response(422,['error'=>'invalid_credentials']);
        $ip=(string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
        $this->repo->throttle('login-ip',$ip,25,900);
        $this->repo->throttle('login-account',$email,7,900);
        $row=$this->repo->one('SELECT id, password_hash, status FROM users WHERE email=?',[$email]);
        if (!$row || !password_verify($password,(string)$row['password_hash']) || $row['status']!=='active') $this->response(401,['error'=>'invalid_credentials']);
        \kg_begin_session();session_regenerate_id(true);
        $_SESSION['prod_user_id']=(int)$row['id']; $_SESSION['csrf']=bin2hex(random_bytes(32));
        $this->response(200,['identity'=>$this->current(),'csrf_token'=>$_SESSION['csrf']]);
    }
    private function listPublicOrMine(array $config): never
    {
        $table=$config['table'];
        if ($table==='plant_cases') $this->response(403,['error'=>'private_resource_use_mine']);
        $cursor=$this->cursor();
        if ($table==='listings') $rows=$this->repo->all('SELECT l.id,l.crop,l.district,l.quantity_kg,l.price_per_kg,l.description,l.created_at,u.display_name AS seller FROM listings l JOIN users u ON u.id=l.seller_id WHERE l.status=? AND l.id<? ORDER BY l.id DESC LIMIT 30',['published',$cursor]);
        elseif ($table==='buyer_requirements') $rows=$this->repo->all('SELECT r.id,r.crop,r.district,r.quantity_kg,r.target_price_per_kg,r.created_at,u.display_name AS buyer FROM buyer_requirements r JOIN users u ON u.id=r.buyer_id WHERE r.status=? AND r.id<? ORDER BY r.id DESC LIMIT 30',['published',$cursor]);
        else $rows=$this->repo->all('SELECT p.id,p.topic,p.body,p.created_at,u.display_name AS author FROM community_posts p JOIN users u ON u.id=p.author_id WHERE p.status=? AND p.id<? ORDER BY p.id DESC LIMIT 30',['published',$cursor]);
        $this->response(200,$rows);
    }
    private function listOwned(array $config): never
    {
        $user=$this->requireUser();
        $table=$config['table'];$owner=$config['owner'];
        $this->response(200,$this->repo->all("SELECT * FROM {$table} WHERE {$owner}=? AND id<? ORDER BY id DESC LIMIT 50",[(int)$user['id'],$this->cursor()]));
    }
    private function listingDetail(int $id): never
    {
        $row=$this->repo->one('SELECT l.*,u.display_name AS seller FROM listings l JOIN users u ON u.id=l.seller_id WHERE l.id=?',[$id]);
        if (!$row) $this->response(404,['error'=>'not_found']);
        if ($row['status']!=='published') {
            $me=$this->current();
            if (!$me || ((int)$me['id'] !== (int)$row['seller_id'] && !in_array($me['role'],['editor','admin'],true))) $this->response(404,['error'=>'not_found']);
        }
        $this->response(200,$row);
    }
    private function create(array $config,array $input): never
    {
        $user=$this->requireUser($config['roles']);
        $owner=(int)$user['id'];$table=$config['table'];
        $this->repo->throttle('content-user',(string)$owner,60,3600);
        if ($table==='listings') {
            $id=$this->repo->insert('INSERT INTO listings (seller_id,crop,district,quantity_kg,price_per_kg,description) VALUES (?,?,?,?,?,?)',[
                $owner,Validation::text($input,'crop',100),Validation::text($input,'district',100),Validation::number($input,'quantity_kg',0.01,100000000),Validation::number($input,'price_per_kg',0.01,10000000),Validation::text($input,'description',600)
            ]);
        } elseif ($table==='buyer_requirements') {
            $id=$this->repo->insert('INSERT INTO buyer_requirements (buyer_id,crop,district,quantity_kg,target_price_per_kg) VALUES (?,?,?,?,?)',[
                $owner,Validation::text($input,'crop',100),Validation::text($input,'district',100),Validation::number($input,'quantity_kg',0.01,100000000),Validation::number($input,'target_price_per_kg',0.01,10000000)
            ]);
        } elseif ($table==='community_posts') {
            $id=$this->repo->insert('INSERT INTO community_posts (author_id,topic,body) VALUES (?,?,?)',[$owner,Validation::text($input,'topic',80),Validation::text($input,'body',1500,5)]);
        } else {
            $id=$this->repo->insert('INSERT INTO plant_cases (owner_id,crop,growth_stage,symptoms) VALUES (?,?,?,?)',[$owner,Validation::text($input,'crop',100),Validation::choice($input,'growth_stage',['seedling','vegetative','flowering','fruiting','harvest','unknown']),Validation::text($input,'symptoms',1200,8)]);
        }
        $this->response(201,['id'=>$id,'status'=>$table==='plant_cases'?'recorded':'pending_review','stored'=>true]);
    }
    private function enquire(array $input): never
    {
        $user=$this->requireUser(['buyer','fpo','admin']);
        $listingId=$this->authorizedId((string)($input['listing_id']??''));
        $amount=Validation::number($input,'quantity_kg',0.01,100000000);
        $message=Validation::text($input,'message',500);
        $listing=$this->repo->one('SELECT id,seller_id,status,quantity_kg FROM listings WHERE id=?',[$listingId]);
        if (!$listing || $listing['status']!=='published') $this->response(404,['error'=>'listing_not_found']);
        if ((int)$listing['seller_id']===(int)$user['id']) $this->response(403,['error'=>'self_enquiry_forbidden']);
        if ((float)$amount>(float)$listing['quantity_kg']) $this->response(422,['error'=>'quantity_exceeds_listing']);
        $this->repo->throttle('enquiry-user',(string)$user['id'],20,3600);
        $id=$this->repo->insert('INSERT INTO enquiries (listing_id,buyer_id,quantity_kg,message) VALUES (?,?,?,?)',[$listingId,(int)$user['id'],$amount,$message]);
        $this->response(201,['id'=>$id,'status'=>'submitted','notifications_sent'=>false]);
    }
    private function reviewCases(): never
    {
        $this->requireUser(['editor','admin']);
        $items=[];
        foreach ([['listing','listings'],['requirement','buyer_requirements'],['post','community_posts']] as [$kind,$table]) {
            foreach ($this->repo->all("SELECT id,status,created_at FROM {$table} WHERE status='pending_review' ORDER BY id DESC LIMIT 30") as $row) $items[]=['type'=>$kind]+$row;
        }
        $this->response(200,['items'=>$items]);
    }
    private function decide(string $kind,int $id,array $input): never
    {
        $user=$this->requireUser($kind==='post'?['editor','admin']:['admin']);
        $decision=Validation::choice($input,'decision',['approve','reject']);
        $reason=Validation::text($input,'reason',400,10);
        $table=['listing'=>'listings','requirement'=>'buyer_requirements','post'=>'community_posts'][$kind];
        $owner=['listing'=>'seller_id','requirement'=>'buyer_id','post'=>'author_id'][$kind];
        $new=$decision==='approve'?'published':'rejected';
        $this->repo->transaction(function () use ($table,$owner,$id,$user,$kind,$reason,$new): void {
            $item=$this->repo->one("SELECT {$owner} AS owner,status FROM {$table} WHERE id=? FOR UPDATE",[$id]);
            if (!$item) $this->response(404,['error'=>'not_found']);
            if ($item['status']!=='pending_review') $this->response(409,['error'=>'already_reviewed']);
            if ((int)$item['owner']===(int)$user['id']) $this->response(403,['error'=>'self_approval_forbidden']);
            if ($new==='published' && $kind!=='post') {
                $account=$this->repo->one('SELECT verified_at,status FROM users WHERE id=?',[(int)$item['owner']]);
                if (!$account || !$account['verified_at'] || $account['status']!=='active') $this->response(409,['error'=>'owner_verification_required']);
            }
            $this->repo->exec("UPDATE {$table} SET status=? WHERE id=? AND status='pending_review'",[$new,$id]);
            $this->logAudit((int)$user['id'],'review_'.$new,$kind,$id,'pending_review',$new,$reason);
        });
        $this->response(200,['id'=>$id,'status'=>$new]);
    }
    private function verifyUser(int $id,array $input): never
    {
        $admin=$this->requireUser(['admin']);
        $reason=Validation::text($input,'reason',400,15);
        if ($id===(int)$admin['id']) $this->response(403,['error'=>'self_verification_forbidden']);
        $this->repo->transaction(function () use ($id,$admin,$reason): void {
            $person=$this->repo->one('SELECT status,verified_at FROM users WHERE id=? FOR UPDATE',[$id]);
            if (!$person) $this->response(404,['error'=>'not_found']);
            if ($person['status']!=='active' || $person['verified_at']!==null) $this->response(409,['error'=>'verification_not_allowed']);
            $this->repo->exec('UPDATE users SET verified_at=UTC_TIMESTAMP() WHERE id=? AND verified_at IS NULL',[$id]);
            $this->logAudit((int)$admin['id'],'manual_identity_verification','user',$id,'unverified','verified',$reason);
        });
        $this->response(200,['id'=>$id,'verified'=>true]);
    }
}
