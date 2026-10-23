<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SaludController extends Controller
{
    public function __invoke(): JsonResponse
    {
        DB::connection()->getPdo();

        return response()->json([
            'estado' => 'ok',
            'version' => 'v1',
            'base_de_datos' => 'disponible',
        ]);
    }
}
