<?php

use App\Http\Controllers\Api\AutenticacionController;
use App\Http\Controllers\Api\ImportacionController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AutenticacionController::class, 'login']);

Route::middleware('auth:api')->group(function (): void {
    Route::get('usuario', [AutenticacionController::class, 'usuario']);
    Route::post('logout', [AutenticacionController::class, 'logout']);

    Route::apiResource('importaciones', ImportacionController::class)
        ->parameters(['importaciones' => 'importacion']);
});
