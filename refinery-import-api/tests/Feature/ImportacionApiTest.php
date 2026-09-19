<?php

namespace Tests\Feature;

use App\Models\Importacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Passport\ClientRepository;
use Laravel\Passport\Passport;
use Tests\TestCase;

class ImportacionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_puede_listar_y_filtrar_importaciones(): void
    {
        $this->autenticarUsuario();
        Importacion::factory()->create(['estado' => 'Recibida', 'proveedor' => 'ALFA LAVAL']);
        Importacion::factory()->create(['estado' => 'En tránsito', 'proveedor' => 'SIEMENS']);

        $this->getJson('/api/importaciones?estado=Recibida&buscar=ALFA')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.proveedor', 'ALFA LAVAL');
    }

    public function test_puede_crear_una_importacion(): void
    {
        $this->autenticarUsuario();

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
        $this->autenticarUsuario();

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
        $this->autenticarUsuario();
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

    public function test_el_crud_requiere_un_token_bearer_valido(): void
    {
        $this->getJson('/api/importaciones')
            ->assertUnauthorized();
    }

    public function test_client_credentials_puede_consumir_el_endpoint_de_servicio(): void
    {
        $cliente = app(ClientRepository::class)
            ->createClientCredentialsGrantClient('Cliente de servicio para pruebas');

        $respuestaToken = $this->post('/oauth/token', [
            'grant_type' => 'client_credentials',
            'client_id' => $cliente->id,
            'client_secret' => $cliente->plainSecret,
            'scope' => 'importaciones.read',
        ], [
            'Accept' => 'application/json',
        ]);

        $respuestaToken
            ->assertOk()
            ->assertJsonStructure(['token_type', 'expires_in', 'access_token']);

        $this->withToken($respuestaToken->json('access_token'))
            ->getJson('/api/servicio/importaciones')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_password_grant_permite_login_refresh_y_logout(): void
    {
        $cliente = app(ClientRepository::class)
            ->createPasswordGrantClient('Cliente password de pruebas', 'users', true);

        config([
            'services.passport.password_client_id' => $cliente->id,
            'services.passport.password_client_secret' => $cliente->plainSecret,
        ]);

        $usuario = User::factory()->create([
            'email' => 'admin@refineryimport.test',
            'password' => Hash::make('Refinery2026!'),
        ]);

        $this->postJson('/api/login', [
            'email' => $usuario->email,
            'password' => 'Refinery2026!',
            'scopes' => ['importaciones.read'],
        ])
            ->assertOk()
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonStructure(['access_token', 'refresh_token', 'expires_in']);

        $respuestaLogin = $this->postJson('/api/login', [
            'email' => $usuario->email,
            'password' => 'Refinery2026!',
            'scopes' => ['importaciones.read'],
        ])->assertOk();

        $respuestaRefresh = $this->post('/oauth/token', [
            'grant_type' => 'refresh_token',
            'refresh_token' => $respuestaLogin->json('refresh_token'),
            'client_id' => $cliente->id,
            'client_secret' => $cliente->plainSecret,
            'scope' => 'importaciones.read',
        ], [
            'Accept' => 'application/json',
        ]);

        $respuestaRefresh
            ->assertOk()
            ->assertJsonStructure(['access_token', 'refresh_token', 'expires_in']);

        $this->withToken($respuestaRefresh->json('access_token'))
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('usuario.email', $usuario->email);

        $this->withToken($respuestaRefresh->json('access_token'))
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertDatabaseHas('oauth_access_tokens', ['revoked' => true]);
        $this->assertDatabaseHas('oauth_refresh_tokens', ['revoked' => true]);
    }

    public function test_scopes_permiten_lectura_y_denegan_escritura_y_eliminacion(): void
    {
        $cliente = app(ClientRepository::class)
            ->createPasswordGrantClient('Cliente de scopes para pruebas', 'users', true);

        config([
            'services.passport.password_client_id' => $cliente->id,
            'services.passport.password_client_secret' => $cliente->plainSecret,
        ]);

        $usuario = User::factory()->create([
            'email' => 'lector@refineryimport.test',
            'password' => Hash::make('Refinery2026!'),
        ]);

        $respuestaLogin = $this->postJson('/api/login', [
            'email' => $usuario->email,
            'password' => 'Refinery2026!',
            'scopes' => ['importaciones.read'],
        ])->assertOk();

        $token = $respuestaLogin->json('access_token');
        $importacion = Importacion::factory()->create();

        $this->withToken($token)
            ->getJson('/api/importaciones')
            ->assertOk();

        $this->withToken($token)
            ->postJson('/api/importaciones', $this->datosValidos())
            ->assertForbidden();

        $this->withToken($token)
            ->deleteJson("/api/importaciones/{$importacion->id}")
            ->assertForbidden();
    }

    public function test_login_rechaza_scopes_no_definidos(): void
    {
        $this->postJson('/api/login', [
            'email' => 'usuario@ejemplo.com',
            'password' => 'secreto',
            'scopes' => ['importaciones.inexistente'],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['scopes.0']);
    }

    private function autenticarUsuario(): User
    {
        $usuario = User::factory()->create();

        Passport::actingAs($usuario, ['*']);

        return $usuario;
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
