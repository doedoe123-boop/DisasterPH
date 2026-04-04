<?php

namespace App\Jobs;

use App\Transformers\PagasaEventTransformer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class IngestPagasaAdvisoriesJob implements ShouldQueue
{
    use Queueable;

    public function handle(PagasaEventTransformer $transformer): void
    {
        // Fetch PAGASA advisories, normalize bulletin fields,
        // and persist actionable weather incidents.
    }
}
