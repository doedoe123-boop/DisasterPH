<?php

namespace App\Jobs;

use App\Transformers\EonetEventTransformer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class IngestEonetEventsJob implements ShouldQueue
{
    use Queueable;

    public function handle(EonetEventTransformer $transformer): void
    {
        // Fetch EONET payload, transform to normalized incidents,
        // then upsert while marking records as reference-only.
    }
}
