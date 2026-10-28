<?php

use App\Http\Controllers\Api\AutenticacionController;
use App\Http\Controllers\Api\ExternalImportacionController;
use App\Http\Controllers\Api\ImportacionController;
use App\Http\Controllers\Api\OperacionController;
use App\Http\Controllers\Api\SaludController;
use Illuminate\Support\Facades\Route;

// Contrato estable para el sistema externo existente.
Route::prefix('v1')->group(function (): void {
    Route::get('salud', SaludController::class);

    Route::middleware(['throttle:external-api', 'external.api'])->group(function (): void {
        Route::apiResource('importaciones', ExternalImportacionController::class)
            ->parameters(['importaciones' => 'importacion']);
    });
});

// API completa que consume la aplicación Expo.
Route::middleware('throttle:login')->post('login', [AutenticacionController::class, 'login']);

Route::middleware('auth:api')->group(function (): void {
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

    Route::middleware('scope:admin,importaciones.read')->group(function (): void {
        Route::get('dashboard', [OperacionController::class, 'dashboard']);
        Route::get('directorios', [OperacionController::class, 'directorios']);
        Route::get('reportes/resumen', [OperacionController::class, 'reporte']);
        Route::get('tareas', [OperacionController::class, 'tareas']);
        Route::get('incidencias', [OperacionController::class, 'incidencias']);
        Route::get('importaciones/{importacion}/eventos', [OperacionController::class, 'eventos']);
        Route::get('importaciones/{importacion}/documentos', [OperacionController::class, 'documentos']);
        Route::get('importaciones/{importacion}/recepciones', [OperacionController::class, 'recepciones']);
        Route::get('documentos/{documento}/descargar', [OperacionController::class, 'descargarDocumento']);
    });

    Route::middleware('scope:admin,importaciones.write')->group(function (): void {
        Route::post('importaciones/{importacion}/eventos', [OperacionController::class, 'guardarEvento']);
        Route::post('importaciones/{importacion}/documentos', [OperacionController::class, 'guardarDocumento']);
        Route::patch('documentos/{documento}', [OperacionController::class, 'actualizarDocumento']);
        Route::post('tareas', [OperacionController::class, 'guardarTarea']);
        Route::patch('tareas/{tarea}', [OperacionController::class, 'actualizarTarea']);
        Route::post('importaciones/{importacion}/recepciones', [OperacionController::class, 'guardarRecepcion']);
        Route::post('incidencias', [OperacionController::class, 'guardarIncidencia']);
        Route::patch('incidencias/{incidencia}', [OperacionController::class, 'actualizarIncidencia']);
    });

    Route::get('auditoria', [OperacionController::class, 'auditoria'])
        ->middleware('scope:admin');
});
