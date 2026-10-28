<?php

namespace Tests\Feature;

use App\Models\Importacion;
use App\Models\Proveedor;
use App\Models\TareaOperativa;
use App\Models\Ubicacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;
use Tests\TestCase;

class CommercialOperationsApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $usuario;

    protected function setUp(): void
    {
        parent::setUp();
        $this->usuario = User::factory()->create(['role' => 'admin']);
        Passport::actingAs($this->usuario, ['admin']);
    }

    public function test_dashboard_consolida_alertas_y_metricas(): void
    {
        $importacion = Importacion::factory()->create(['estado' => 'En tránsito', 'valor_usd' => 250000]);
        TareaOperativa::create([
            'importacion_id' => $importacion->id,
            'creada_por' => $this->usuario->id,
            'titulo' => 'Tarea vencida',
            'prioridad' => 'Alta',
            'estado' => 'Pendiente',
            'vence_en' => now()->subHour(),
        ]);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.total_importaciones', 1)
            ->assertJsonPath('data.valor_activo_usd', 250000)
            ->assertJsonPath('data.tareas_vencidas', 1)
            ->assertJsonCount(1, 'data.alertas');
    }

    public function test_registra_eventos_documentos_y_auditoria(): void
    {
        Storage::fake('local');
        $importacion = Importacion::factory()->create();

        $this->postJson("/api/importaciones/{$importacion->id}/eventos", [
            'tipo' => 'Naviera',
            'titulo' => 'Buque zarpó del puerto de origen',
            'ubicacion' => 'Hamburgo',
        ])->assertCreated();

        $this->post("/api/importaciones/{$importacion->id}/documentos", [
            'tipo' => 'BL / BOL',
            'version' => '1.0',
            'archivo' => UploadedFile::fake()->create('bl.pdf', 180, 'application/pdf'),
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('data.nombre_original', 'bl.pdf');

        $this->getJson("/api/importaciones/{$importacion->id}/eventos")->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/importaciones/{$importacion->id}/documentos")->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/auditoria')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_gestiona_tareas_e_incidencias(): void
    {
        $importacion = Importacion::factory()->create();

        $tarea = $this->postJson('/api/tareas', [
            'importacion_id' => $importacion->id,
            'titulo' => 'Confirmar espacio en bodega',
            'prioridad' => 'Alta',
            'vence_en' => now()->addDay()->toISOString(),
        ])->assertCreated()->json('data');

        $this->patchJson("/api/tareas/{$tarea['id']}", ['estado' => 'Completada'])
            ->assertOk()
            ->assertJsonPath('data.estado', 'Completada');

        $incidencia = $this->postJson('/api/incidencias', [
            'importacion_id' => $importacion->id,
            'categoria' => 'Demora',
            'titulo' => 'Cambio de itinerario',
            'descripcion' => 'La naviera informó un transbordo adicional.',
            'severidad' => 'Alta',
        ])->assertCreated()->json('data');

        $this->patchJson("/api/incidencias/{$incidencia['id']}", ['estado' => 'Cerrada'])
            ->assertOk()
            ->assertJsonPath('data.estado', 'Cerrada');
    }

    public function test_recepcion_conforme_cierra_la_importacion(): void
    {
        $importacion = Importacion::factory()->create(['estado' => 'Proceso aduanal', 'progreso' => 88]);

        $this->postJson("/api/importaciones/{$importacion->id}/recepciones", [
            'recibida_en' => now()->toISOString(),
            'bultos_esperados' => 10,
            'bultos_recibidos' => 10,
            'condicion' => 'Conforme',
            'observaciones' => 'Recepción sin diferencias.',
        ])->assertCreated();

        $this->assertDatabaseHas('importaciones', ['id' => $importacion->id, 'estado' => 'Recibida', 'progreso' => 100]);
        $this->assertDatabaseHas('eventos_seguimiento', ['importacion_id' => $importacion->id, 'tipo' => 'Recepción']);
    }

    public function test_directorios_y_reporte_son_consultables(): void
    {
        Proveedor::create(['nombre' => 'Proveedor comercial', 'estado' => 'Activo']);
        Ubicacion::create(['codigo' => 'BOD-01', 'area' => 'Bodega central']);
        Importacion::factory()->create(['proveedor' => 'Proveedor comercial', 'valor_usd' => 50000]);

        $this->getJson('/api/directorios')
            ->assertOk()
            ->assertJsonCount(1, 'data.proveedores')
            ->assertJsonCount(1, 'data.ubicaciones');

        $this->getJson('/api/reportes/resumen')
            ->assertOk()
            ->assertJsonPath('data.valor_total_usd', 50000)
            ->assertJsonCount(1, 'data.operaciones');
    }
}
