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

// Audit logs retention: purge logs older than 24 months (compliance)
// Runs first day of month at 2 AM (non-peak hours)
Schedule::command('audit-logs:purge')
    ->monthlyOn(1, '02:00')
    ->withoutOverlapping();

// Health monitoring: check database, redis, tunnel every 5 minutes
// Logs to service_status, creates critical alerts if services down
Schedule::command('monitor:health')
    ->everyFiveMinutes()
    ->withoutOverlapping();
