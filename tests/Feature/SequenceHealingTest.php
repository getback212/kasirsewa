<?php

namespace Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The sequence heal used to run inside AppServiceProvider::boot(), i.e. on
 * every request — ~75 extra queries per page load plus setval writes that race
 * between concurrent workers. These tests pin the fix in place.
 */
class SequenceHealingTest extends TestCase
{
    use RefreshDatabase;

    public function test_web_requests_do_not_run_sequence_maintenance(): void
    {
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = $query->sql;
        });

        $this->get('/login')->assertOk();

        $this->assertNotEmpty($queries, 'Expected the request to hit the database.');

        foreach ($queries as $sql) {
            $this->assertStringNotContainsStringIgnoringCase('setval', $sql);
            $this->assertStringNotContainsStringIgnoringCase('pg_get_serial_sequence', $sql);
        }
    }

    public function test_sequence_heal_command_is_available_for_restores(): void
    {
        $this->artisan('db:heal-sequences')->assertSuccessful();
    }

    public function test_sequence_heal_is_a_noop_on_non_postgres(): void
    {
        // Tests run on sqlite; the healer must bail out instead of erroring.
        config()->set('database.default', 'sqlite');

        \App\Support\PostgresSequenceHealer::heal();

        $this->assertTrue(true);
    }
}
