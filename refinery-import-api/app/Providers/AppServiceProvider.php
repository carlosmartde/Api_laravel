<?php

namespace App\Providers;

use Carbon\CarbonInterval;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Passport::enablePasswordGrant();
        Passport::tokensExpireIn(CarbonInterval::hours(1));
        Passport::refreshTokensExpireIn(CarbonInterval::days(30));
        Passport::personalAccessTokensExpireIn(CarbonInterval::months(6));

        Passport::tokensCan([
            'importaciones.read' => 'Consultar el listado y detalle de importaciones',
            'importaciones.write' => 'Crear y actualizar importaciones',
            'importaciones.delete' => 'Eliminar importaciones',
            'admin' => 'Acceso administrativo a todas las operaciones',
        ]);

        Passport::defaultScopes(['importaciones.read']);
    }
}
