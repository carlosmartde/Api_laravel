<?php

use App\Http\Controllers\Api\ImportacionController;
use Illuminate\Support\Facades\Route;

Route::apiResource('importaciones', ImportacionController::class)
    ->parameters(['importaciones' => 'importacion']);
