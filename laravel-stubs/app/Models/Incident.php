<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    protected $fillable = [
        'source',
        'external_id',
        'event_type',
        'title',
        'description',
        'latitude',
        'longitude',
        'severity',
        'region',
        'started_at',
        'updated_at',
        'metadata',
        'source_hash',
        'first_seen_at',
        'last_seen_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'started_at' => 'datetime',
        'updated_at' => 'datetime',
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
    ];
}
