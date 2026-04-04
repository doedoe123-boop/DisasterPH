<?php

use App\Http\Controllers\Api\IncidentController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/incidents', [IncidentController::class, 'index']);
    Route::get('/incidents/{incident}', [IncidentController::class, 'show']);
    Route::get('/sources/health', [IncidentController::class, 'sourceHealth']);
    Route::get('/stats/overview', [IncidentController::class, 'stats']);
});
