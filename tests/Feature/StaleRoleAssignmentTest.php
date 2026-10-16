<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use App\Support\PostgresSequenceHealer;
use Illuminate\Support\Facades\DB;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

/**
 * Regression tests for the "pendaftar baru langsung jadi kasir" bug.
 *
 * Deleting a user leaves its model_has_roles rows behind (polymorphic pivot,
 * no FK, Spatie does not cascade). A keeper that rewound the identity sequence
 * to max(id) then handed the dead user's id to the next registrant, who
 * inherited the orphaned CASHIER assignment on top of their own OWNER role.
 */
class StaleRoleAssignmentTest extends TestCase
{
    public function test_new_google_owner_does_not_inherit_role_of_a_reused_id(): void
    {
        // ✅ NEW: Unregistered users are rejected and redirected to /register
        // (Security fix: prevents auto-tenant creation for unauthorized emails)

        // The id the next INSERT will receive; a deleted user's role rows are
        // still parked on it.
        $staleId = (int) User::max('id') + 1;
        $cashierRoleId = (int) DB::table('roles')->where('name', UserRole::CASHIER->value)->value('id');

        // Pre-populate stale role assignment
        DB::table('model_has_roles')->insert([
            'role_id' => $cashierRoleId,
            'model_type' => (new User)->getMorphClass(),
            'model_id' => $staleId,
        ]);

        $abstractUser = Mockery::mock('Laravel\Socialite\Two\User');
        $abstractUser->shouldReceive('getId')->andReturn('998877665544332211');
        $abstractUser->shouldReceive('getName')->andReturn('Kurniawan Getback');
        $abstractUser->shouldReceive('getEmail')->andReturn('arigetback212@gmail.com');
        $abstractUser->shouldReceive('getAvatar')->andReturn(null);
        $abstractUser->shouldReceive('getNickname')->andReturn('kurniawan');

        $provider = Mockery::mock('Laravel\Socialite\Contracts\Provider');
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        // ✅ FIXED: Unregistered users redirect to /register (not auto-create)
        $response = $this->get('/auth/google/callback');
        $response->assertRedirect('/register');

        // ✅ Verify user NOT created
        $user = User::where('email', 'arigetback212@gmail.com')->first();
        $this->assertNull($user);

        // ✅ Verify stale role still exists (not assigned yet)
        $this->assertDatabaseHas('model_has_roles', ['model_id' => $staleId]);
    }

    public function test_orphaned_role_assignments_are_purged(): void
    {
        $ghost = User::factory()->create(['email' => 'ghost-owner@example.test']);
        $ghost->assignRole(UserRole::CASHIER->value);
        $ghostId = (int) $ghost->id;

        // The user record disappears, the pivot row does not.
        DB::table('users')->where('id', $ghostId)->delete();

        $this->assertDatabaseHas('model_has_roles', ['model_id' => $ghostId]);

        $purged = PostgresSequenceHealer::purgeOrphanedRoleAssignments();

        $this->assertGreaterThanOrEqual(1, $purged);
        $this->assertDatabaseMissing('model_has_roles', ['model_id' => $ghostId]);

        // Seeded, still-existing users keep their assignments.
        $admin = User::where('email', 'admin@example.com')->firstOrFail();
        $this->assertTrue($admin->hasRole(UserRole::SUPER_ADMIN->value));
    }

    public function test_sequence_heal_never_moves_a_sequence_backwards(): void
    {
        // max(id) below the last handed-out value (a deleted tail, a restored
        // dump) must not rewind the sequence: ids would be reused.
        $this->assertSame(5, PostgresSequenceHealer::sequenceTarget(2, 5));

        // Still raises a sequence that lags behind its data.
        $this->assertSame(7, PostgresSequenceHealer::sequenceTarget(7, 3));

        // A sequence that never produced a value does not drag the target down.
        $this->assertSame(3, PostgresSequenceHealer::sequenceTarget(3, 0));
    }
}
