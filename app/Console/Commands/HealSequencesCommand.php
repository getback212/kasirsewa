<?php

namespace App\Console\Commands;

use App\Support\PostgresSequenceHealer;
use Illuminate\Console\Command;

class HealSequencesCommand extends Command
{
    protected $signature = 'db:heal-sequences';

    protected $description = 'Selaraskan sequence PostgreSQL dengan max(id) tiap tabel (setelah restore/import)';

    public function handle(): int
    {
        if (config('database.default') !== 'pgsql') {
            $this->warn('Koneksi database bukan PostgreSQL — tidak ada yang dilakukan.');

            return self::SUCCESS;
        }

        PostgresSequenceHealer::heal();

        $this->info('Sequence PostgreSQL sudah diselaraskan dengan max(id) setiap tabel.');

        return self::SUCCESS;
    }
}
