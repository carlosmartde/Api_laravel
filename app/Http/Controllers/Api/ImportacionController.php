<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GuardarImportacionRequest;
use App\Http\Resources\ImportacionResource;
use App\Models\EventoSeguimiento;
use App\Models\Importacion;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ImportacionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filtros = $request->validate([
            'buscar' => ['sometimes', 'nullable', 'string', 'max:100'],
            'estado' => ['sometimes', 'nullable', 'string', 'max:50'],
        ]);

        $importaciones = Importacion::query()
            ->withCount([
                'documentos',
                'tareas as tareas_pendientes_count' => fn ($query) => $query->where('estado', '!=', 'Completada'),
                'incidencias as incidencias_abiertas_count' => fn ($query) => $query->where('estado', '!=', 'Cerrada'),
            ])
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
            ->get();

        return ImportacionResource::collection($importaciones)->additional([
            'mensaje' => 'Importaciones consultadas correctamente.',
        ]);
    }

    public function store(GuardarImportacionRequest $request): JsonResponse
    {
        $importacion = Importacion::create($request->validated());

        EventoSeguimiento::create([
            'importacion_id' => $importacion->id,
            'usuario_id' => $request->user()?->id,
            'tipo' => 'Creación',
            'estado' => $importacion->estado,
            'titulo' => 'Expediente creado',
            'descripcion' => "Se registró la importación {$importacion->referencia}.",
            'ocurrido_en' => now(),
        ]);
        $importacion->update(['ultimo_evento_en' => now()]);
        AuditService::record($request, 'crear', $importacion, 'Importación creada', null, $importacion->toArray());

        return (new ImportacionResource($importacion))
            ->additional(['mensaje' => 'Importación creada correctamente.'])
            ->response()
            ->setStatusCode(201);
    }

    public function show(Importacion $importacion): ImportacionResource
    {
        $importacion->loadCount([
            'documentos',
            'tareas as tareas_pendientes_count' => fn ($query) => $query->where('estado', '!=', 'Completada'),
            'incidencias as incidencias_abiertas_count' => fn ($query) => $query->where('estado', '!=', 'Cerrada'),
        ]);

        return (new ImportacionResource($importacion))->additional([
            'mensaje' => 'Importación consultada correctamente.',
        ]);
    }

    public function update(GuardarImportacionRequest $request, Importacion $importacion): ImportacionResource
    {
        $antes = $importacion->toArray();
        $estadoAnterior = $importacion->estado;
        $importacion->update($request->validated());

        if ($importacion->estado !== $estadoAnterior) {
            EventoSeguimiento::create([
                'importacion_id' => $importacion->id,
                'usuario_id' => $request->user()?->id,
                'tipo' => 'Estado',
                'estado' => $importacion->estado,
                'titulo' => "Estado actualizado a {$importacion->estado}",
                'descripcion' => "El expediente avanzó desde {$estadoAnterior}.",
                'ocurrido_en' => now(),
            ]);
            $importacion->forceFill([
                'ultimo_evento_en' => now(),
                'recibida_en' => $importacion->estado === 'Recibida' ? now() : $importacion->recibida_en,
            ])->save();
        }

        AuditService::record($request, 'actualizar', $importacion, 'Importación actualizada', $antes, $importacion->fresh()->toArray());

        return (new ImportacionResource($importacion->refresh()))->additional([
            'mensaje' => 'Importación actualizada correctamente.',
        ]);
    }

    public function destroy(Request $request, Importacion $importacion): JsonResponse
    {
        $antes = $importacion->toArray();
        AuditService::record($request, 'eliminar', $importacion, 'Importación eliminada', $antes);
        $importacion->delete();

        return response()->json([
            'mensaje' => 'Importación eliminada correctamente.',
        ]);
    }
}
