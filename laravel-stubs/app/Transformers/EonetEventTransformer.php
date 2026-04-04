<?php

namespace App\Transformers;

class EonetEventTransformer
{
    public function transform(array $payload): array
    {
        return [
            'source' => 'EONET',
            'external_id' => (string) ($payload['id'] ?? ''),
            'event_type' => 'flood',
            'title' => $payload['title'] ?? 'Unnamed EONET event',
            'description' => 'Reference event from NASA EONET for visualization.',
            'latitude' => $payload['geometry'][0]['coordinates'][1] ?? 0,
            'longitude' => $payload['geometry'][0]['coordinates'][0] ?? 0,
            'severity' => 'watch',
            'region' => 'Philippines',
            'started_at' => $payload['geometry'][0]['date'] ?? now()->toIso8601String(),
            'updated_at' => now()->toIso8601String(),
            'metadata' => [
                'confidence' => 'reference-only',
            ],
        ];
    }
}
