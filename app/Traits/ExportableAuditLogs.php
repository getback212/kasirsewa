<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Collection;
use League\Csv\Writer;
use Symfony\Component\HttpFoundation\StreamedResponse;

trait ExportableAuditLogs
{
    /**
     * Export audit logs to CSV
     */
    public function exportCsv(Collection $logs, string $filename = 'audit-logs'): StreamedResponse
    {
        $headers = [
            'Waktu' => 'created_at',
            'Aksi' => 'action',
            'Model' => 'model_type',
            'User' => 'user.name',
            'Email' => 'user.email',
            'Tenant' => 'tenant.name',
            'Status Visibilitas' => 'visible_to',
            'Impersonated By' => 'impersonated_by_user.name',
        ];

        $response = new StreamedResponse(function () use ($logs, $headers) {
            $csv = Writer::createFromResource(fopen('php://output', 'w'));
            $csv->insertOne(array_keys($headers));

            foreach ($logs as $log) {
                $row = [];
                foreach ($headers as $header => $key) {
                    $value = $this->getNestedValue($log, $key);
                    $row[] = is_array($value) ? json_encode($value) : $value;
                }
                $csv->insertOne($row);
            }
        });

        $response->headers->set('Content-Type', 'text/csv; charset=utf-8');
        $response->headers->set('Content-Disposition', "attachment; filename=\"{$filename}.csv\"");
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');

        return $response;
    }

    /**
     * Get nested value from object/array
     */
    private function getNestedValue($object, string $key)
    {
        $keys = explode('.', $key);
        $value = $object;

        foreach ($keys as $k) {
            if (is_object($value)) {
                $value = $value->$k ?? null;
            } elseif (is_array($value)) {
                $value = $value[$k] ?? null;
            } else {
                return null;
            }
        }

        return $value;
    }

    /**
     * Format date for display
     */
    protected function formatDate($dateString): string
    {
        if (!$dateString) return '';
        $date = new \DateTime($dateString);
        return $date->format('d/m/Y H:i');
    }
}
