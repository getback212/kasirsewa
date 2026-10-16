<?php

namespace App\Http\Controllers\Expense;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\StoreExpenseRequest;
use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user->hasPermissionTo('view-expenses') && ! $user->hasRole(['SUPER_ADMIN', 'OWNER', 'MANAGER'])) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengelola pengeluaran operasional toko.');
        }

        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');

        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());
        $category = $request->input('category');

        $query = Expense::with('user')
            ->where('outlet_id', $activeOutletId)
            ->whereBetween('expense_date', [$startDate, $endDate]);

        if ($category) {
            $query->where('category', $category);
        }

        $expenses = $query->latest('expense_date')->latest('id')->get();
        $totalExpenses = (float) $expenses->sum('amount');

        return Inertia::render('Expenses/Index', [
            'expenses' => $expenses,
            'totalExpenses' => $totalExpenses,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'category' => $category,
            ],
        ]);
    }

    public function store(StoreExpenseRequest $request): RedirectResponse
    {
        $user = $request->user();
        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');

        $validated = $request->validated();

        Expense::create([
            'outlet_id' => $activeOutletId,
            'user_id' => $user->id,
            'category' => $validated['category'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'amount' => (float) $validated['amount'],
            'expense_date' => $validated['expense_date'],
        ]);

        return redirect()->back()->with('success', 'Biaya operasional baru berhasil dicatat!');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');

        if (! $user->hasPermissionTo('edit-expenses') && ! $user->hasRole(['SUPER_ADMIN', 'OWNER', 'MANAGER'])) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengubah pengeluaran toko.');
        }

        $expense = Expense::where('outlet_id', $activeOutletId)->findOrFail($id);

        $validated = $request->validate([
            'category' => ['required', 'string'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'amount' => ['required', 'numeric', 'min:1'],
            'expense_date' => ['required', 'date'],
        ]);

        $expense->update([
            'category' => $validated['category'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'amount' => (float) $validated['amount'],
            'expense_date' => $validated['expense_date'],
        ]);

        return redirect()->back()->with('success', 'Data pengeluaran operasional berhasil diperbarui!');
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $activeOutletId = $this->resolveScopedOutletId($request);
        abort_unless($activeOutletId, 403, 'Outlet aktif tidak valid.');

        if (! $user->hasPermissionTo('delete-expenses') && ! $user->hasRole(['SUPER_ADMIN', 'OWNER', 'MANAGER'])) {
            abort(403, 'Anda tidak memiliki hak akses untuk menghapus catatan pengeluaran.');
        }

        $expense = Expense::where('outlet_id', $activeOutletId)->findOrFail($id);
        $expense->delete();

        return redirect()->back()->with('success', 'Catatan pengeluaran berhasil dihapus.');
    }
}
