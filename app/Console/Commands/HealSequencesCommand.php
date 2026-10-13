<?php

namespace App\Console\Commands;

use App\Support\PostgresSequenceHealer;
use Illuminate\Console\Command;

class HealSequencesCommand extends Command
{
    protected $signature = 'db:heal-sequences';

    protected $description = 'Selaraskan sequence PostgreSQL dengan max(id) tiap tabel (hanya dinaikkan) & bersihkan penetapan role yatim';

    public function handle(): int
    {
        if (config('database.default') !== 'pgsql') {
            $this->warn('Koneksi database bukan PostgreSQL — tidak ada yang dilakukan.');

            return self::SUCCESS;
        }

        PostgresSequenceHealer::heal();
        $purged = PostgresSequenceHealer::purgeOrphanedRoleAssignments();

        $this->info('Sequence PostgreSQL sudah diselaraskan (hanya dinaikkan, tidak pernah diturunkan).');

        if ($purged > 0) {
            $this->info("{$purged} penetapan role/permission yatim (user-nya sudah dihapus) dibersihkan.");
        }

        return self::SUCCESS;
    }
}
