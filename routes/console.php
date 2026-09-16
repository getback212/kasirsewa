<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('db:backup')->dailyAt('00:00');
