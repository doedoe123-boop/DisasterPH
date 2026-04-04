<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncidentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Incident::query()->latest('updated_at');

        if ($request->filled('type')) {
            $query->where('event_type', $request->string('type'));
        }

        if ($request->filled('source')) {
            $query->where('source', $request->string('source'));
        }

        return response()->json([
            'data' => $query->limit(100)->get(),
            'meta' => [
                'generated_at' => now()->toIso8601String(),
            ],
        ]);
    }

    public function show(Incident $incident): JsonResponse
    {
        return response()->json(['data' => $incident]);
    }

    public function sourceHealth(): JsonResponse
    {
        return response()->json([
            'data' => [
                ['source' => 'PAGASA', 'status' => 'healthy'],
                ['source' => 'PHIVOLCS', 'status' => 'healthy'],
                ['source' => 'EONET', 'status' => 'delayed'],
            ],
        ]);
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'data' => [
                'active_alerts' => Incident::count(),
                'priority_alerts' => Incident::whereIn('severity', ['warning', 'critical'])->count(),
            ],
        ]);
    }
}
