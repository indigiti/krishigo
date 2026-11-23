<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/src/Json/LiveMandi.php';
use KrishiGo\Json\LiveMandi;

function expect_ok(bool $condition, string $message): void {
 if (!$condition) { fwrite(STDERR, "FAILED: $message\n"); exit(1); }
}
function expect_invalid(array $query): void {
 try { LiveMandi::parameters($query); } catch (InvalidArgumentException) { return; }
 fwrite(STDERR, "Expected an invalid request\n"); exit(1);
}
$params=LiveMandi::parameters(['state'=>'Maharashtra','district'=>'Pune','commodity'=>'Onion','page'=>'2','limit'=>'20','date'=>'2026-11-23']);
expect_ok($params['page']===2 && $params['limit']===20,'pagination');
expect_ok($params['filters']['arrival_date']==='23/11/2026','government date format');
expect_ok(LiveMandi::parameters([])['filters']['state']==='Maharashtra','default state');
expect_invalid(['commodity'=>'Onion&api-key=bad']);
expect_invalid(['date'=>'2026-02-30']);
expect_invalid(['page'=>'-1']);
expect_invalid(['limit'=>'0']);
expect_invalid(['anything'=>'unexpected']);
$sample=['state'=>'Maharashtra','district'=>'Pune','market'=>'Pune','commodity'=>'Onion','variety'=>'Local','grade'=>'FAQ','arrival_date'=>'23/11/2026','min_price'=>'1000','max_price'=>'2000','modal_price'=>'1500'];
$normalized=LiveMandi::normalize($sample);
expect_ok($normalized!==null && $normalized['modal_price']===1500.0,'normalize legitimate reported price');
expect_ok($normalized['arrival_date']==='2026-11-23','normalize observation date');
expect_ok($normalized['price_unit']==='INR/quintal','explicit units');
expect_ok($normalized['quality_warning']===false,'normal range');
$bad=$sample;$bad['min_price']='-1';
expect_ok(LiveMandi::normalize($bad)===null,'reject negative prices');
$bad=$sample;$bad['max_price']='1';
expect_ok(LiveMandi::normalize($bad)===null,'reject inverse min max');
$bad=$sample;$bad['arrival_date']='31/02/2026';
expect_ok(LiveMandi::normalize($bad)===null,'reject invalid observation dates');
$bad=$sample;$bad['modal_price']='2100';
expect_ok(LiveMandi::normalize($bad)['quality_warning']===true,'flag modal outside min max');
echo "AGMARKNET parameter and normalization tests passed\n";
