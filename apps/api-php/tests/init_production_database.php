<?php
declare(strict_types=1);
/** Integration test DB initializer. Will not run outside a database explicitly suffixed _test. */
require_once dirname(__DIR__) . '/src/Core.php';
require_once dirname(__DIR__) . '/src/Production/Connection.php';
$dsn=kg_env('KRISHIGO_DB_DSN');
if (PHP_SAPI!=='cli' || !preg_match('/(?:^|;)dbname=[a-z0-9_]*_test(?:;|$)/i',$dsn)) {fwrite(STDERR,"Refusing non-test database\n");exit(1);}
$pdo=\KrishiGo\Production\Connection::open();
foreach (['001_core.sql','002_platform_foundations.sql','003_trade_lifecycle.sql','004_core_guardrails.sql'] as $migration) {
    $script=file_get_contents(dirname(__DIR__).'/database/migrations/'.$migration);
    if (!is_string($script)) throw new RuntimeException('Migration unavailable: '.$migration);
    $clean=preg_replace('/^\s*--.*$/m','',$script);
    foreach (explode(';',(string)$clean) as $stmt) {
        $stmt=trim($stmt);
        if ($stmt!=='') $pdo->exec($stmt);
    }
}
$pdo->exec('UPDATE production_module_flags SET enabled=1,revision=1,updated_by=NULL');
foreach (['farm_fields','trade_activity','operations_audit','notification_events','notification_preferences','agronomy_intakes',
'trade_orders','trade_quotes','supplier_profiles','farmer_profiles','source_data_snapshots',
'knowledge_articles','knowledge_sources','audit_events','enquiries','plant_cases',
'community_posts','buyer_requirements','listings','auth_rate_limits','users'] as $table)
    $pdo->exec('DELETE FROM '.$table);
$adminPass=getenv('KRISHIGO_TEST_ADMIN_PASSWORD') ?: '';
if (strlen($adminPass)<12) throw new RuntimeException('Test admin password missing');
$insert=$pdo->prepare("INSERT INTO users (display_name,email,password_hash,role,verified_at) VALUES ('CI Administrator','admin@krishigo.test',?,'admin',UTC_TIMESTAMP())");
$insert->execute([password_hash($adminPass,PASSWORD_DEFAULT)]);
$editor=$pdo->prepare("INSERT INTO users (display_name,email,password_hash,role,verified_at) VALUES ('CI Editor','editor@krishigo.test',?,'editor',UTC_TIMESTAMP())");
$editor->execute([password_hash($adminPass,PASSWORD_DEFAULT)]);
echo "Initialized production integration database with schema 004\n";
