<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('db:backup')->dailyAt('00:00');

// Subscription & trial lifecycle: H-7/H-3/H-1 billing reminders, trial
// expiry, grace period and suspension. Runs every morning in app timezone
// (Asia/Jakarta) so reminders reach tenants during business hours. The
// command is idempotent per-tenant-per-day, and withoutOverlapping stops a
// slow run from stacking on the next tick.
Schedule::command('app:check-subscription-expiry')
    ->dailyAt('07:00')
    ->withoutOverlapping();
