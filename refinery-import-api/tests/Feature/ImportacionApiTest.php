<?php

namespace Tests\Feature;

use App\Models\Importacion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ImportacionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_puede_listar_y_filtrar_importaciones(): void
    {
        Importacion::factory()->create(['estado' => 'Recibida', 'proveedor' => 'ALFA LAVAL']);
        Importacion::factory()->create(['estado' => 'En tránsito', 'proveedor' => 'SIEMENS']);

        $this->getJson('/api/importaciones?estado=Recibida&buscar=ALFA')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.proveedor', 'ALFA LAVAL');
    }

    public function test_puede_crear_una_importacion(): void
    {
        $this->postJson('/api/importaciones', $this->datosValidos())
            ->assertCreated()
            ->assertJsonPath('data.bl', 'TEST-123456789')
            ->assertJsonPath('data.progreso', 25);

        $this->assertDatabaseHas('importaciones', [
            'bl' => 'TEST-123456789',
            'proveedor' => 'Proveedor de prueba',
        ]);
    }

    public function test_rechaza_datos_invalidos(): void
    {
        $this->postJson('/api/importaciones', [
            'bl' => '',
            'progreso' => 120,
            'estado' => 'Desconocido',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['bl', 'referencia', 'estado', 'progreso']);
    }

    public function test_puede_consultar_actualizar_y_eliminar_una_importacion(): void
    {
        $importacion = Importacion::factory()->create();

        $this->getJson("/api/importaciones/{$importacion->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $importacion->id);

        $this->putJson("/api/importaciones/{$importacion->id}", [
            'estado' => 'Recibida',
            'progreso' => 100,
        ])
            ->assertOk()
            ->assertJsonPath('data.estado', 'Recibida')
            ->assertJsonPath('data.progreso', 100);

        $this->deleteJson("/api/importaciones/{$importacion->id}")
            ->assertOk()
            ->assertJsonPath('mensaje', 'Importación eliminada correctamente.');

        $this->assertDatabaseMissing('importaciones', ['id' => $importacion->id]);
    }

    private function datosValidos(): array
    {
        return [
            'bl' => 'TEST-123456789',
            'referencia' => 'IMP-TEST-001',
            'proveedor' => 'Proveedor de prueba',
            'material' => 'Repuestos industriales',
            'transportista' => 'Naviera de prueba',
            'origen' => 'Hamburgo, Alemania',
            'puerto_destino' => 'Puerto Santo Tomás',
            'incoterm' => 'CIF Puerto Santo Tomás',
            'fecha_estimada_arribo' => '2026-09-15',
            'estado' => 'En tránsito',
            'progreso' => 25,
            'contenedor' => 'TEST 123456-7',
            'valor_usd' => 12500.50,
        ];
    }
}
