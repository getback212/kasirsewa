<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // sales
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'cashier_id') && Schema::hasColumn('sales', 'tenant_id')) {
                try {
                    $table->dropForeign(['cashier_id']);
                } catch (Throwable $e) {
                }
            }
        });
        Schema::table('sales', function (Blueprint $table) {
            $table->foreign('cashier_id')->references('id')->on('users');
        });

        // sales_returns
        Schema::table('sales_returns', function (Blueprint $table) {
            if (Schema::hasColumn('sales_returns', 'cashier_id')) {
                try {
                    $table->dropForeign(['cashier_id']);
                } catch (Throwable $e) {
                }
            }
        });
        Schema::table('sales_returns', function (Blueprint $table) {
            $table->foreign('cashier_id')->references('id')->on('users');
        });

        // purchases
        Schema::table('purchases', function (Blueprint $table) {
            if (Schema::hasColumn('purchases', 'user_id')) {
                try {
                    $table->dropForeign(['user_id']);
                } catch (Throwable $e) {
                }
            }
        });
        Schema::table('purchases', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users');
        });

        // shifts
        Schema::table('shifts', function (Blueprint $table) {
            if (Schema::hasColumn('shifts', 'user_id')) {
                try {
                    $table->dropForeign(['user_id']);
                } catch (Throwable $e) {
                }
            }
        });
        Schema::table('shifts', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users');
        });

        // cash_movements
        Schema::table('cash_movements', function (Blueprint $table) {
            if (Schema::hasColumn('cash_movements', 'user_id')) {
                try {
                    $table->dropForeign(['user_id']);
                } catch (Throwable $e) {
                }
            }
        });
        Schema::table('cash_movements', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users');
        });

        // expenses
        Schema::table('expenses', function (Blueprint $table) {
            if (Schema::hasColumn('expenses', 'user_id')) {
                try {
                    $table->dropForeign(['user_id']);
                } catch (Throwable $e) {
                }
            }
        });
        Schema::table('expenses', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users');
        });

        // held_transactions
        Schema::table('held_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('held_transactions', 'cashier_id')) {
                try {
                    $table->dropForeign(['cashier_id']);
                } catch (Throwable $e) {
                }
            }
        });
        Schema::table('held_transactions', function (Blueprint $table) {
            $table->foreign('cashier_id')->references('id')->on('users');
        });

        // stock_opnames
        Schema::table('stock_opnames', function (Blueprint $table) {
            if (Schema::hasColumn('stock_opnames', 'user_id')) {
                try {
                    $table->dropForeign(['user_id']);
                } catch (Throwable $e) {
                }
            }
        });
        Schema::table('stock_opnames', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users');
        });

        // stock_transfers
        Schema::table('stock_transfers', function (Blueprint $table) {
            if (Schema::hasColumn('stock_transfers', 'user_id')) {
                try {
                    $table->dropForeign(['user_id']);
                } catch (Throwable $e) {
                }
            }
        });
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users');
        });

        // stock_movements
        Schema::table('stock_movements', function (Blueprint $table) {
            if (Schema::hasColumn('stock_movements', 'user_id')) {
                try {
                    $table->dropForeign(['user_id']);
                } catch (Throwable $e) {
                }
            }
        });
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        // Revert to CASCADE
        Schema::table('stock_movements', function (Blueprint $table) {
            try {
                $table->dropForeign(['user_id']);
            } catch (Throwable $e) {
            }
        });
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        $tables = ['stock_transfers', 'stock_opnames', 'held_transactions', 'expenses', 'cash_movements', 'shifts', 'purchases', 'sales_returns', 'sales'];
        foreach ($tables as $t) {
            Schema::table($t, function (Blueprint $table) use ($t) {
                $cols = ['cashier_id', 'user_id'];
                foreach ($cols as $c) {
                    if (Schema::hasColumn($t, $c)) {
                        try {
                            $table->dropForeign([$c]);
                        } catch (Throwable $e) {
                        }
                        $table->foreign($c)->references('id')->on('users')->cascadeOnDelete();
                    }
                }
            });
        }
    }
};
