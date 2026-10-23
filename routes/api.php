<?php

use App\Http\Controllers\Api\ImportacionController;
use App\Http\Controllers\Api\SaludController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('salud', SaludController::class);

    Route::middleware(['throttle:external-api', 'external.api'])->group(function (): void {
        Route::apiResource('importaciones', ImportacionController::class)
            ->parameters(['importaciones' => 'importacion']);
    });
});
