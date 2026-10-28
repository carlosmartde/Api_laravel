<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentoImportacion;
use App\Models\EventoSeguimiento;
use App\Models\Importacion;
use App\Models\Incidencia;
use App\Models\Proveedor;
use App\Models\RegistroAuditoria;
use App\Models\TareaOperativa;
use App\Models\Ubicacion;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class OperacionController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $porEstado = Importacion::query()
            ->selectRaw('estado, COUNT(*) as total')
            ->groupBy('estado')
            ->pluck('total', 'estado');

        $tareasVencidas = TareaOperativa::query()
            ->where('estado', '!=', 'Completada')
            ->whereNotNull('vence_en')
            ->where('vence_en', '<', now())
            ->count();

        $incidenciasAbiertas = Incidencia::query()->where('estado', '!=', 'Cerrada')->count();
        $documentosPendientes = DocumentoImportacion::query()->where('estado', 'Pendiente')->count();

        return response()->json([
            'data' => [
                'total_importaciones' => Importacion::count(),
                'valor_activo_usd' => (float) Importacion::where('estado', '!=', 'Recibida')->sum('valor_usd'),
                'por_estado' => $porEstado,
                'tareas_vencidas' => $tareasVencidas,
                'incidencias_abiertas' => $incidenciasAbiertas,
                'documentos_pendientes' => $documentosPendientes,
                'proximos_arribos' => Importacion::query()
                    ->where('estado', '!=', 'Recibida')
                    ->orderBy('fecha_estimada_arribo')
                    ->limit(5)
                    ->get(['id', 'bl', 'referencia', 'proveedor', 'fecha_estimada_arribo', 'estado', 'prioridad']),
                'alertas' => $this->alertas(),
            ],
        ]);
    }

    public function eventos(Importacion $importacion): JsonResponse
    {
        return response()->json([
            'data' => $importacion->eventos()->with('usuario:id,name')->get(),
        ]);
    }

    public function guardarEvento(Request $request, Importacion $importacion): JsonResponse
    {
        $datos = $request->validate([
            'tipo' => ['required', 'string', 'max:40'],
            'estado' => ['sometimes', 'nullable', 'string', 'max:50'],
            'titulo' => ['required', 'string', 'max:160'],
            'descripcion' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'ubicacion' => ['sometimes', 'nullable', 'string', 'max:160'],
            'ocurrido_en' => ['sometimes', 'date'],
        ]);

        $evento = $importacion->eventos()->create([
            ...$datos,
            'usuario_id' => $request->user()->id,
            'ocurrido_en' => $datos['ocurrido_en'] ?? now(),
        ]);

        $importacion->update(['ultimo_evento_en' => $evento->ocurrido_en]);
        AuditService::record($request, 'crear', $evento, 'Evento de seguimiento registrado', null, $evento->toArray());

        return response()->json(['data' => $evento->load('usuario:id,name')], 201);
    }

    public function documentos(Importacion $importacion): JsonResponse
    {
        return response()->json([
            'data' => $importacion->documentos()->latest()->get(),
        ]);
    }

    public function guardarDocumento(Request $request, Importacion $importacion): JsonResponse
    {
        $datos = $request->validate([
            'tipo' => ['required', 'string', 'max:80'],
            'version' => ['sometimes', 'string', 'max:40'],
            'vence_en' => ['sometimes', 'nullable', 'date'],
            'archivo' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp,xls,xlsx,doc,docx', 'max:10240'],
        ]);

        $archivo = $request->file('archivo');
        $nombreSeguro = now()->format('YmdHis').'-'.Str::random(8).'.'.$archivo->getClientOriginalExtension();
        $ruta = $archivo->storeAs("importaciones/{$importacion->id}", $nombreSeguro, 'local');

        $documento = $importacion->documentos()->create([
            'subido_por' => $request->user()->id,
            'tipo' => $datos['tipo'],
            'nombre_original' => $archivo->getClientOriginalName(),
            'version' => $datos['version'] ?? '1.0',
            'estado' => 'Pendiente',
            'ruta' => $ruta,
            'mime' => $archivo->getMimeType(),
            'tamano' => $archivo->getSize(),
            'vence_en' => $datos['vence_en'] ?? null,
        ]);

        AuditService::record($request, 'cargar', $documento, 'Documento agregado al expediente', null, $documento->toArray());

        return response()->json(['data' => $documento], 201);
    }

    public function actualizarDocumento(Request $request, DocumentoImportacion $documento): JsonResponse
    {
        $datos = $request->validate([
            'estado' => ['required', Rule::in(['Pendiente', 'En revisión', 'Validado', 'Rechazado'])],
        ]);
        $antes = $documento->toArray();
        $documento->update($datos);
        AuditService::record($request, 'validar', $documento, 'Estado documental actualizado', $antes, $documento->toArray());

        return response()->json(['data' => $documento]);
    }

    public function descargarDocumento(DocumentoImportacion $documento): BinaryFileResponse
    {
        abort_unless(Storage::disk('local')->exists($documento->ruta), 404, 'El archivo no está disponible.');

        return response()->download(
            Storage::disk('local')->path($documento->ruta),
            $documento->nombre_original,
            ['Content-Type' => $documento->mime],
        );
    }

    public function tareas(Request $request): JsonResponse
    {
        $tareas = TareaOperativa::query()
            ->with('importacion:id,bl,referencia')
            ->when($request->string('estado')->toString(), fn ($query, $estado) => $query->where('estado', $estado))
            ->orderByRaw("CASE prioridad WHEN 'Crítica' THEN 1 WHEN 'Alta' THEN 2 WHEN 'Media' THEN 3 ELSE 4 END")
            ->orderBy('vence_en')
            ->get();

        return response()->json(['data' => $tareas]);
    }

    public function guardarTarea(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'importacion_id' => ['sometimes', 'nullable', 'exists:importaciones,id'],
            'asignada_a' => ['sometimes', 'nullable', 'exists:users,id'],
            'titulo' => ['required', 'string', 'max:180'],
            'descripcion' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'prioridad' => ['required', Rule::in(['Baja', 'Media', 'Alta', 'Crítica'])],
            'vence_en' => ['sometimes', 'nullable', 'date'],
        ]);
        $tarea = TareaOperativa::create([...$datos, 'creada_por' => $request->user()->id]);
        AuditService::record($request, 'crear', $tarea, 'Tarea operativa creada', null, $tarea->toArray());

        return response()->json(['data' => $tarea->load('importacion:id,bl,referencia')], 201);
    }

    public function actualizarTarea(Request $request, TareaOperativa $tarea): JsonResponse
    {
        $datos = $request->validate([
            'titulo' => ['sometimes', 'string', 'max:180'],
            'descripcion' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'prioridad' => ['sometimes', Rule::in(['Baja', 'Media', 'Alta', 'Crítica'])],
            'estado' => ['sometimes', Rule::in(['Pendiente', 'En curso', 'Completada', 'Cancelada'])],
            'vence_en' => ['sometimes', 'nullable', 'date'],
            'asignada_a' => ['sometimes', 'nullable', 'exists:users,id'],
        ]);
        $antes = $tarea->toArray();
        if (($datos['estado'] ?? null) === 'Completada') {
            $datos['completada_en'] = now();
        }
        $tarea->update($datos);
        AuditService::record($request, 'actualizar', $tarea, 'Tarea operativa actualizada', $antes, $tarea->toArray());

        return response()->json(['data' => $tarea->load('importacion:id,bl,referencia')]);
    }

    public function recepciones(Importacion $importacion): JsonResponse
    {
        return response()->json(['data' => $importacion->recepciones()->latest('recibida_en')->get()]);
    }

    public function guardarRecepcion(Request $request, Importacion $importacion): JsonResponse
    {
        $datos = $request->validate([
            'recibida_en' => ['required', 'date'],
            'bultos_esperados' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'bultos_recibidos' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'condicion' => ['required', Rule::in(['Conforme', 'Con diferencias', 'Dañada', 'Parcial'])],
            'observaciones' => ['sometimes', 'nullable', 'string', 'max:3000'],
        ]);
        $recepcion = $importacion->recepciones()->create([...$datos, 'recibida_por' => $request->user()->id]);

        EventoSeguimiento::create([
            'importacion_id' => $importacion->id,
            'usuario_id' => $request->user()->id,
            'tipo' => 'Recepción',
            'estado' => $datos['condicion'] === 'Conforme' ? 'Recibida' : $importacion->estado,
            'titulo' => "Recepción {$datos['condicion']}",
            'descripcion' => $datos['observaciones'] ?? 'Recepción registrada en planta.',
            'ubicacion' => $importacion->destino_planta,
            'ocurrido_en' => $datos['recibida_en'],
        ]);

        if ($datos['condicion'] === 'Conforme') {
            $importacion->update(['estado' => 'Recibida', 'progreso' => 100, 'recibida_en' => $datos['recibida_en'], 'ultimo_evento_en' => $datos['recibida_en']]);
        }
        AuditService::record($request, 'crear', $recepcion, 'Recepción en planta registrada', null, $recepcion->toArray());

        return response()->json(['data' => $recepcion], 201);
    }

    public function incidencias(Request $request): JsonResponse
    {
        $incidencias = Incidencia::query()
            ->with('importacion:id,bl,referencia')
            ->when($request->integer('importacion_id'), fn ($query, $id) => $query->where('importacion_id', $id))
            ->when($request->string('estado')->toString(), fn ($query, $estado) => $query->where('estado', $estado))
            ->latest('abierta_en')
            ->get();

        return response()->json(['data' => $incidencias]);
    }

    public function guardarIncidencia(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'importacion_id' => ['required', 'exists:importaciones,id'],
            'categoria' => ['required', Rule::in(['Demora', 'Documentación', 'Aduana', 'Daño', 'Faltante', 'Otro'])],
            'titulo' => ['required', 'string', 'max:180'],
            'descripcion' => ['required', 'string', 'max:3000'],
            'severidad' => ['required', Rule::in(['Baja', 'Media', 'Alta', 'Crítica'])],
            'asignada_a' => ['sometimes', 'nullable', 'exists:users,id'],
        ]);
        $incidencia = Incidencia::create([
            ...$datos,
            'reportada_por' => $request->user()->id,
            'abierta_en' => now(),
        ]);
        AuditService::record($request, 'crear', $incidencia, 'Incidencia reportada', null, $incidencia->toArray());

        return response()->json(['data' => $incidencia->load('importacion:id,bl,referencia')], 201);
    }

    public function actualizarIncidencia(Request $request, Incidencia $incidencia): JsonResponse
    {
        $datos = $request->validate([
            'estado' => ['sometimes', Rule::in(['Abierta', 'En investigación', 'Resuelta', 'Cerrada'])],
            'severidad' => ['sometimes', Rule::in(['Baja', 'Media', 'Alta', 'Crítica'])],
            'asignada_a' => ['sometimes', 'nullable', 'exists:users,id'],
        ]);
        $antes = $incidencia->toArray();
        if (($datos['estado'] ?? null) === 'Cerrada') {
            $datos['cerrada_en'] = now();
        }
        $incidencia->update($datos);
        AuditService::record($request, 'actualizar', $incidencia, 'Incidencia actualizada', $antes, $incidencia->toArray());

        return response()->json(['data' => $incidencia->load('importacion:id,bl,referencia')]);
    }

    public function directorios(): JsonResponse
    {
        return response()->json([
            'data' => [
                'proveedores' => Proveedor::query()->withCount('importaciones')->orderBy('nombre')->get(),
                'ubicaciones' => Ubicacion::query()->withCount('importaciones')->orderBy('area')->get(),
            ],
        ]);
    }

    public function reporte(): JsonResponse
    {
        return response()->json([
            'data' => [
                'generado_en' => now()->toISOString(),
                'valor_total_usd' => (float) Importacion::sum('valor_usd'),
                'valor_activo_usd' => (float) Importacion::where('estado', '!=', 'Recibida')->sum('valor_usd'),
                'por_estado' => Importacion::selectRaw('estado, COUNT(*) total, SUM(valor_usd) valor')->groupBy('estado')->get(),
                'por_proveedor' => Importacion::selectRaw('proveedor, COUNT(*) total, SUM(valor_usd) valor')->groupBy('proveedor')->orderByDesc('valor')->get(),
                'operaciones' => Importacion::query()->orderBy('fecha_estimada_arribo')->get(),
            ],
        ]);
    }

    public function auditoria(): JsonResponse
    {
        return response()->json([
            'data' => RegistroAuditoria::query()->latest()->limit(100)->get(),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function alertas(): array
    {
        $alertas = [];

        foreach (TareaOperativa::with('importacion:id,bl,referencia')->where('estado', '!=', 'Completada')->where('vence_en', '<', now())->limit(5)->get() as $tarea) {
            $alertas[] = ['tipo' => 'Tarea vencida', 'severidad' => 'Alta', 'titulo' => $tarea->titulo, 'importacion' => $tarea->importacion];
        }
        foreach (Incidencia::with('importacion:id,bl,referencia')->where('estado', '!=', 'Cerrada')->whereIn('severidad', ['Alta', 'Crítica'])->limit(5)->get() as $incidencia) {
            $alertas[] = ['tipo' => 'Incidencia', 'severidad' => $incidencia->severidad, 'titulo' => $incidencia->titulo, 'importacion' => $incidencia->importacion];
        }
        foreach (Importacion::where('estado', '!=', 'Recibida')->whereDate('fecha_estimada_arribo', '<', today())->limit(5)->get() as $importacion) {
            $alertas[] = ['tipo' => 'ETA vencida', 'severidad' => 'Alta', 'titulo' => "{$importacion->referencia} superó su ETA", 'importacion' => $importacion->only(['id', 'bl', 'referencia'])];
        }

        return array_slice($alertas, 0, 10);
    }
}
