<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Subcategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Category::with(['subcategories' => function ($q) {
            $q->where('is_active', true)->orderBy('name');
        }]);

        if (!$request->boolean('include_inactive', false)) {
            $query->where('is_active', true);
        }

        $categories = $query->orderBy('name')->get();

        return response()->json([
            'data' => CategoryResource::collection($categories),
        ]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['name']);

        // Ensure unique slug
        $baseSlug = $data['slug'];
        $counter = 1;
        while (Category::withTrashed()->where('slug', $data['slug'])->exists()) {
            $data['slug'] = $baseSlug . '-' . $counter;
            $counter++;
        }

        $category = Category::create($data);

        // Create subcategories if provided
        if (!empty($data['subcategories'])) {
            foreach ($data['subcategories'] as $sub) {
                $subSlug = Str::slug($sub['name']);
                $category->subcategories()->create([
                    'name' => $sub['name'],
                    'slug' => $subSlug,
                    'description' => $sub['description'] ?? null,
                ]);
            }
        }

        $category->load('subcategories');
        AuditLog::log('created', $category, null, $category->toArray());

        return response()->json([
            'message' => 'Kategori berhasil ditambahkan.',
            'data' => new CategoryResource($category),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $category = Category::with('subcategories')->withCount('cases')->findOrFail($id);

        return response()->json([
            'data' => new CategoryResource($category),
        ]);
    }

    public function update(StoreCategoryRequest $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $oldValues = $category->toArray();
        $data = $request->validated();

        if (isset($data['name']) && $data['name'] !== $category->name) {
            $data['slug'] = Str::slug($data['name']);
            $baseSlug = $data['slug'];
            $counter = 1;
            while (Category::withTrashed()->where('slug', $data['slug'])->where('id', '!=', $id)->exists()) {
                $data['slug'] = $baseSlug . '-' . $counter;
                $counter++;
            }
        }

        $category->update($data);

        // Update/create subcategories if provided
        if (isset($data['subcategories'])) {
            $existingIds = [];
            foreach ($data['subcategories'] as $sub) {
                if (isset($sub['id'])) {
                    $subcategory = Subcategory::find($sub['id']);
                    if ($subcategory && $subcategory->category_id === $category->id) {
                        $subcategory->update([
                            'name' => $sub['name'],
                            'slug' => Str::slug($sub['name']),
                            'description' => $sub['description'] ?? null,
                        ]);
                        $existingIds[] = $subcategory->id;
                    }
                } else {
                    $newSub = $category->subcategories()->create([
                        'name' => $sub['name'],
                        'slug' => Str::slug($sub['name']),
                        'description' => $sub['description'] ?? null,
                    ]);
                    $existingIds[] = $newSub->id;
                }
            }
        }

        $category->load('subcategories');
        AuditLog::log('updated', $category, $oldValues, $category->toArray());

        return response()->json([
            'message' => 'Kategori berhasil diperbarui.',
            'data' => new CategoryResource($category),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $category = Category::findOrFail($id);

        // Check if category has cases
        if ($category->cases()->exists()) {
            return response()->json([
                'message' => 'Kategori tidak dapat dihapus karena masih memiliki kasus terkait.',
            ], 422);
        }

        $oldValues = $category->toArray();
        AuditLog::log('deleted', $category, $oldValues, null);

        $category->subcategories()->delete();
        $category->delete();

        return response()->json([
            'message' => 'Kategori berhasil dihapus.',
        ]);
    }

    // Subcategory endpoints
    public function storeSubcategory(Request $request, int $categoryId): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $category = Category::findOrFail($categoryId);

        $subcategory = $category->subcategories()->create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
        ]);

        AuditLog::log('created', $subcategory, null, $subcategory->toArray());

        return response()->json([
            'message' => 'Subkategori berhasil ditambahkan.',
            'data' => $subcategory,
        ], 201);
    }

    public function destroySubcategory(Request $request, int $categoryId, int $subcategoryId): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $subcategory = Subcategory::where('category_id', $categoryId)->findOrFail($subcategoryId);

        if ($subcategory->cases()->exists()) {
            return response()->json([
                'message' => 'Subkategori tidak dapat dihapus karena masih memiliki kasus terkait.',
            ], 422);
        }

        $oldValues = $subcategory->toArray();
        AuditLog::log('deleted', $subcategory, $oldValues, null);
        $subcategory->delete();

        return response()->json([
            'message' => 'Subkategori berhasil dihapus.',
        ]);
    }
}
