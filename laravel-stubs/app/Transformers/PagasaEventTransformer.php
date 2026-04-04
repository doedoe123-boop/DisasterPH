<?php

namespace App\Transformers;

class PagasaEventTransformer
{
    public function transform(array $payload): array
    {
        return [
            'source' => 'PAGASA',
            'external_id' => (string) ($payload['id'] ?? ''),
            'event_type' => $payload['event_type'] ?? 'typhoon',
            'title' => $payload['title'] ?? 'PAGASA advisory',
            'description' => $payload['description'] ?? '',
            'latitude' => $payload['latitude'] ?? 0,
            'longitude' => $payload['longitude'] ?? 0,
            'severity' => $payload['severity'] ?? 'watch',
            'region' => $payload['region'] ?? 'Philippines',
            'started_at' => $payload['started_at'] ?? now()->toIso8601String(),
            'updated_at' => now()->toIso8601String(),
            'metadata' => $payload['metadata'] ?? [],
        ];
    }
}
