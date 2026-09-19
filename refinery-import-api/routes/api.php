<?php

use App\Http\Controllers\Api\AutenticacionController;
use App\Http\Controllers\Api\ImportacionController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AutenticacionController::class, 'login']);

Route::middleware('client:importaciones.read')->get(
    'servicio/importaciones',
    [ImportacionController::class, 'index'],
);

Route::middleware('auth:api')->group(function (): void {
    Route::get('usuario', [AutenticacionController::class, 'usuario']);
    Route::get('me', [AutenticacionController::class, 'usuario']);
    Route::post('logout', [AutenticacionController::class, 'logout']);

    Route::get('importaciones', [ImportacionController::class, 'index'])
        ->middleware('scope:admin,importaciones.read');
    Route::get('importaciones/{importacion}', [ImportacionController::class, 'show'])
        ->middleware('scope:admin,importaciones.read');
    Route::post('importaciones', [ImportacionController::class, 'store'])
        ->middleware('scope:admin,importaciones.write');
    Route::match(['put', 'patch'], 'importaciones/{importacion}', [ImportacionController::class, 'update'])
        ->middleware('scope:admin,importaciones.write');
    Route::delete('importaciones/{importacion}', [ImportacionController::class, 'destroy'])
        ->middleware('scope:admin,importaciones.delete');
});
