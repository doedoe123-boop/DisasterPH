<?php

namespace App\Transformers;

class PhivolcsEventTransformer
{
    public function transform(array $payload): array
    {
        return [
            'source' => 'PHIVOLCS',
            'external_id' => (string) ($payload['id'] ?? ''),
            'event_type' => $payload['event_type'] ?? 'earthquake',
            'title' => $payload['title'] ?? 'PHIVOLCS bulletin',
            'description' => $payload['description'] ?? '',
            'latitude' => $payload['latitude'] ?? 0,
            'longitude' => $payload['longitude'] ?? 0,
            'severity' => $payload['severity'] ?? 'advisory',
            'region' => $payload['region'] ?? 'Philippines',
            'started_at' => $payload['started_at'] ?? now()->toIso8601String(),
            'updated_at' => now()->toIso8601String(),
            'metadata' => $payload['metadata'] ?? [],
        ];
    }
}
