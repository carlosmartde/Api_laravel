<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Passport\Passport;
use Tests\TestCase;

class SistemaBTareasApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.sistema_b.url' => 'https://tareas.example/api/v1',
            'services.sistema_b.token' => 'token-privado-prueba',
            'services.sistema_b.timeout' => 5,
        ]);
        Passport::actingAs(User::factory()->create(['role' => 'admin']), ['admin']);
    }

    public function test_lista_todas_las_tareas_con_paginacion_y_token_privado(): void
    {
        Http::fake([
            'https://tareas.example/api/v1/tareas*' => Http::response([
                'data' => [['id' => 10, 'title' => 'Validar BL', 'created_by' => ['name' => 'Enfoque']]],
                'current_page' => 1,
                'last_page' => 1,
            ]),
        ]);

        $this->getJson('/api/integraciones/sistema-b/tareas?per_page=100&page=1')
            ->assertOk()
            ->assertJsonPath('data.0.id', 10);

        Http::assertSent(fn (Request $request): bool =>
            $request->url() === 'https://tareas.example/api/v1/tareas?per_page=100&page=1'
            && $request->hasHeader('Authorization', 'Bearer token-privado-prueba')
        );
    }

    public function test_crea_tarea_idempotente_y_conserva_estado_del_servidor(): void
    {
        Http::fake([
            'https://tareas.example/api/v1/tareas' => Http::response([
                'data' => ['id' => 42, 'title' => 'Revisar documentos', 'client_reference' => 'refinery-tarea-abc'],
            ], 201),
        ]);

        $this->postJson('/api/integraciones/sistema-b/tareas', [
            'title' => 'Revisar documentos',
            'category' => 'Importaciones',
            'priority' => 'Alta',
            'completed' => false,
            'client_reference' => 'refinery-tarea-abc',
            'importation_id' => '7',
            'importation_reference' => 'IMP-2026-007',
        ])->assertCreated()->assertJsonPath('data.id', 42);

        Http::assertSent(fn (Request $request): bool =>
            $request->method() === 'POST'
            && $request['client_reference'] === 'refinery-tarea-abc'
        );
    }

    public function test_crea_recordatorio_para_tarea_remota(): void
    {
        Http::fake([
            'https://tareas.example/api/v1/recordatorios' => Http::response([
                'data' => ['id' => 9, 'task_id' => 42],
            ], 201),
        ]);

        $this->postJson('/api/integraciones/sistema-b/recordatorios', [
            'task_id' => 42,
            'remind_at' => now()->addHour()->toISOString(),
        ])->assertCreated()->assertJsonPath('data.task_id', 42);
    }

    public function test_no_expone_una_integracion_sin_token(): void
    {
        config(['services.sistema_b.token' => null]);

        $this->getJson('/api/integraciones/sistema-b/tareas')
            ->assertStatus(503)
            ->assertJsonMissing(['token' => 'token-privado-prueba']);

        Http::assertNothingSent();
    }
}
