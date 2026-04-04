<?php

namespace App\Jobs;

use App\Transformers\PhivolcsEventTransformer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class IngestPhivolcsBulletinsJob implements ShouldQueue
{
    use Queueable;

    public function handle(PhivolcsEventTransformer $transformer): void
    {
        // Fetch earthquake and volcano bulletins, normalize the event payloads,
        // and upsert into the incident store.
    }
}
