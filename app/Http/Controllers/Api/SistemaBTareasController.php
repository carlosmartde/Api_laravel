<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;

class SistemaBTareasController extends Controller
{
    public function salud(): JsonResponse
    {
        return $this->forward('GET', '/salud', [], false);
    }

    public function tareas(Request $request): JsonResponse
    {
        return $this->forward('GET', '/tareas', $this->pagination($request));
    }

    public function tarea(int $tarea): JsonResponse
    {
        return $this->forward('GET', "/tareas/{$tarea}");
    }

    public function guardarTarea(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
            'priority' => ['sometimes', Rule::in(['Alta', 'Media', 'Baja'])],
            'completed' => ['sometimes', 'boolean'],
            'client_reference' => ['required', 'string', 'max:191'],
            'importation_id' => ['sometimes', 'nullable', 'string', 'max:100'],
            'importation_reference' => ['sometimes', 'nullable', 'string', 'max:191'],
            'due_at' => ['sometimes', 'nullable', 'date'],
        ]);

        return $this->forward('POST', '/tareas', $data);
    }

    public function actualizarTarea(Request $request, int $tarea): JsonResponse
    {
        $data = $request->validate([
            'completed' => ['required', 'boolean'],
        ]);

        return $this->forward('PATCH', "/tareas/{$tarea}", $data);
    }

    public function recordatorios(Request $request): JsonResponse
    {
        $query = $this->pagination($request);
        if ($request->has('alarmas')) {
            $query['alarmas'] = $request->boolean('alarmas') ? 1 : 0;
        }

        return $this->forward('GET', '/recordatorios', $query);
    }

    public function guardarRecordatorio(Request $request): JsonResponse
    {
        $data = $request->validate([
            'task_id' => ['required', 'integer', 'min:1'],
            'remind_at' => ['required', 'date', 'after:now'],
        ]);

        return $this->forward('POST', '/recordatorios', $data);
    }

    public function actualizarRecordatorio(Request $request, int $recordatorio): JsonResponse
    {
        $data = $request->validate([
            'read' => ['required', 'boolean'],
        ]);

        return $this->forward('PATCH', "/recordatorios/{$recordatorio}", $data);
    }

    private function pagination(Request $request): array
    {
        return $request->validate([
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);
    }

    private function client(bool $authenticated = true): PendingRequest
    {
        $client = Http::acceptJson()
            ->asJson()
            ->timeout(max(1, (int) config('services.sistema_b.timeout', 15)));

        if ($authenticated) {
            $client = $client->withToken((string) config('services.sistema_b.token'));
        }

        return $client;
    }

    private function forward(string $method, string $path, array $data = [], bool $authenticated = true): JsonResponse
    {
        $baseUrl = rtrim((string) config('services.sistema_b.url'), '/');
        $token = (string) config('services.sistema_b.token');

        if ($baseUrl === '' || ($authenticated && $token === '')) {
            return response()->json([
                'message' => 'La integración de tareas todavía no tiene credenciales configuradas en el servidor.',
            ], 503);
        }

        try {
            $response = $method === 'GET'
                ? $this->client($authenticated)->get("{$baseUrl}{$path}", $data)
                : $this->client($authenticated)->send($method, "{$baseUrl}{$path}", ['json' => $data]);
        } catch (ConnectionException) {
            return response()->json([
                'message' => 'No fue posible contactar la API externa de tareas.',
            ], 502);
        }

        $payload = $response->json();
        if (! is_array($payload)) {
            return response()->json([
                'message' => 'La API externa de tareas devolvió una respuesta no válida.',
            ], 502);
        }

        return response()->json($payload, $response->status());
    }
}
