<?php
declare(strict_types=1);
/** One-time privileged account creation from CLI. Never expose this script in the web root. */
require_once dirname(__DIR__) . '/src/Core.php';
require_once dirname(__DIR__) . '/src/Production/Connection.php';
if (PHP_SAPI !== 'cli' || kg_env('KRISHIGO_API_MODE') !== 'production') {fwrite(STDERR,"CLI production mode required\n");exit(1);}
$email = strtolower(kg_env('KRISHIGO_BOOTSTRAP_ADMIN_EMAIL'));
$name = kg_env('KRISHIGO_BOOTSTRAP_ADMIN_NAME');
$password = kg_env('KRISHIGO_BOOTSTRAP_ADMIN_PASSWORD');
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($name) < 2 || strlen($password) < 16) {fwrite(STDERR,"Valid email, name and password >=16 chars required\n");exit(1);}
try {
    $pdo=\KrishiGo\Production\Connection::open();
    $count=(int)$pdo->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn();
    if ($count !== 0) {fwrite(STDERR,"Bootstrap disabled: an admin already exists\n");exit(1);}
    $stmt=$pdo->prepare("INSERT INTO users (display_name,email,password_hash,role,verified_at) VALUES (?,?,?,'admin',UTC_TIMESTAMP())");
    $stmt->execute([$name,$email,password_hash($password,PASSWORD_DEFAULT)]);
    fwrite(STDOUT,"Initial administrator created; rotate bootstrap credentials\n");
} catch (Throwable $e) {fwrite(STDERR,"Bootstrap failed; check database and configuration\n");exit(1);}
