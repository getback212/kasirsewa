import { describe, it, expect } from 'vitest';

function calculateCartTotals(
    items: { price: number; quantity: number; discount_amount?: number }[],
    transactionDiscount: number = 0,
    taxRate: number = 0.11
) {
    const subtotal = items.reduce(
        (sum, item) => sum + (item.price * item.quantity - (item.discount_amount || 0)),
        0
    );
    const taxAmount = Math.round((subtotal - transactionDiscount) * taxRate * 100) / 100;
    const grandTotal = Math.max(0, subtotal - transactionDiscount + taxAmount);

    return { subtotal, taxAmount, grandTotal };
}

describe('Cart Financial Calculation Engine', () => {
    it('calculates single item subtotal, 11% PPN tax, and grand total correctly', () => {
        const items = [{ price: 3500, quantity: 2, discount_amount: 0 }];
        const totals = calculateCartTotals(items, 0, 0.11);

        expect(totals.subtotal).toBe(7000);
        expect(totals.taxAmount).toBe(770);
        expect(totals.grandTotal).toBe(7770);
    });

    it('applies transaction discount before calculating PPN tax', () => {
        const items = [{ price: 100000, quantity: 1, discount_amount: 0 }];
        const totals = calculateCartTotals(items, 10000, 0.11);

        expect(totals.subtotal).toBe(100000);
        expect(totals.taxAmount).toBe(9900); // 11% of 90,000
        expect(totals.grandTotal).toBe(99900);
    });
});
