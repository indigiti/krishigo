<?php
declare(strict_types=1);
namespace KrishiGo\Json;

/**
 * Authenticated staging-only, read-only operational diagnostics.
 * Not a public health endpoint and not a replacement for host monitoring.
 */
final class Doctor {
    public function __construct(private Services $services, private Queue $queue, private string $directory) {}

    public function report(): array {
        $checks = [];
        $modules = $this->services->health();
        $queue = $this->queue->list();
        $enabled = 0;
        $recovered = 0;
        foreach ($modules['domains'] as $name => $state) {
            if ($state['enabled']) $enabled++;
            if ($state['recovered']) $recovered++;
            $checks[] = [
                'id' => 'domain_' . $name,
                'severity' => $state['recovered'] ? 'attention' : 'ok',
                'message' => $state['recovered']
                    ? 'Validated JSON snapshot restored; review storage integrity'
                    : 'Readable JSON domain and module configuration',
            ];
        }
        $dead = (int)($queue['health']['counts']['dead'] ?? 0);
        $failed = (int)($queue['health']['counts']['failed'] ?? 0);
        $pending = (int)($queue['health']['counts']['pending'] ?? 0);
        $checks[] = [
            'id' => 'diagnostic_queue',
            'severity' => $dead > 0 || $failed > 0 ? 'attention' : 'ok',
            'message' => $dead > 0 || $failed > 0
                ? 'Diagnostic jobs require manual review'
                : 'No failed diagnostic jobs',
        ];
        $free = @disk_free_space($this->directory);
        $checks[] = [
            'id' => 'private_json_capacity',
            'severity' => $free === false || $free < 20*1024*1024 ? 'attention' : 'ok',
            'message' => $free === false || $free < 20*1024*1024
                ? 'Private storage capacity is low or unavailable'
                : 'Private JSON storage has available capacity',
        ];
        $checks[] = [
            'id' => 'safe_staging_mode',
            'severity' => \kg_env('KRISHIGO_API_MODE') === 'staging' && \kg_stage_auth_enabled() ? 'ok' : 'critical',
            'message' => \kg_env('KRISHIGO_API_MODE') === 'staging' && \kg_stage_auth_enabled()
                ? 'Staging session boundary enabled'
                : 'Staging mode and authentication must be configured',
        ];
        $attention = count(array_filter($checks, fn($c) => $c['severity'] !== 'ok'));
        return [
            'schema' => 1, 'ok' => $attention === 0,
            'status' => $attention ? 'attention' : 'healthy',
            'database' => 'none', 'external_actions' => false,
            'generated_at' => gmdate('c'), 'checks' => $checks,
            'summary' => [
                'diagnostic_domains' => count($modules['domains']),
                'enabled_diagnostic_domains' => $enabled,
                'restored_snapshots' => $recovered,
                'queue_pending' => $pending, 'queue_failed' => $failed, 'queue_dead' => $dead,
                'available_private_storage_mb' => $free === false ? null : (int)floor($free/(1024*1024)),
            ],
        ];
    }
}
