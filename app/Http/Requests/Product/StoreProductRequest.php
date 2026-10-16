<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermissionTo('create-products');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100'],
            'category_id' => ['required', 'exists:product_categories,id'],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:1000'],
            'barcode' => ['nullable', 'string', 'max:100'],
            'unit' => ['nullable', 'string', 'max:50'],
            'min_stock' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * Sanitize string inputs to prevent XSS
     */
    public function validated($key = null, $default = null): array
    {
        $validated = parent::validated($key, $default);

        foreach (['name', 'description', 'sku', 'barcode', 'unit'] as $field) {
            if (isset($validated[$field]) && is_string($validated[$field])) {
                // Strip HTML tags and trim whitespace
                $validated[$field] = strip_tags(trim($validated[$field]));
            }
        }

        return $validated;
    }
}
