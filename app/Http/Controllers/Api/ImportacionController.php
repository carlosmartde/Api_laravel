<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GuardarImportacionRequest;
use App\Http\Resources\ImportacionResource;
use App\Models\Importacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ImportacionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filtros = $request->validate([
            'buscar' => ['sometimes', 'nullable', 'string', 'max:100'],
            'estado' => ['sometimes', 'nullable', 'string', Rule::in(Importacion::ESTADOS)],
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);

        $importaciones = Importacion::query()
            ->when($filtros['buscar'] ?? null, function ($query, string $buscar): void {
                $query->where(function ($query) use ($buscar): void {
                    $query
                        ->where('bl', 'like', "%{$buscar}%")
                        ->orWhere('referencia', 'like', "%{$buscar}%")
                        ->orWhere('proveedor', 'like', "%{$buscar}%")
                        ->orWhere('material', 'like', "%{$buscar}%");
                });
            })
            ->when($filtros['estado'] ?? null, fn ($query, string $estado) => $query->where('estado', $estado))
            ->latest('id')
            ->paginate($filtros['per_page'] ?? config('external-api.default_page_size', 25))
            ->withQueryString();

        return ImportacionResource::collection($importaciones)->additional([
            'mensaje' => 'Importaciones consultadas correctamente.',
        ]);
    }

    public function store(GuardarImportacionRequest $request): JsonResponse
    {
        $importacion = Importacion::create($request->validated());

        return (new ImportacionResource($importacion))
            ->additional(['mensaje' => 'Importación creada correctamente.'])
            ->response()
            ->setStatusCode(201);
    }

    public function show(Importacion $importacion): ImportacionResource
    {
        return (new ImportacionResource($importacion))->additional([
            'mensaje' => 'Importación consultada correctamente.',
        ]);
    }

    public function update(GuardarImportacionRequest $request, Importacion $importacion): ImportacionResource
    {
        $importacion->update($request->validated());

        return (new ImportacionResource($importacion->refresh()))->additional([
            'mensaje' => 'Importación actualizada correctamente.',
        ]);
    }

    public function destroy(Importacion $importacion): JsonResponse
    {
        $importacion->delete();

        return response()->json([
            'mensaje' => 'Importación eliminada correctamente.',
        ]);
    }
}
