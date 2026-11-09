<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCaseRequest;
use App\Http\Requests\UpdateCaseRequest;
use App\Http\Resources\CaseResource;
use App\Models\AuditLog;
use App\Models\CaseRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CaseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CaseRecord::with(['category', 'subcategory', 'officer', 'creator']);

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('case_number', 'like', "%{$search}%")
                  ->orWhere('reporter_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($categoryId = $request->input('category_id')) {
            $query->byCategory($categoryId);
        }

        if ($subcategoryId = $request->input('subcategory_id')) {
            $query->bySubcategory($subcategoryId);
        }

        if ($status = $request->input('status')) {
            $query->byStatus($status);
        }

        if ($officerId = $request->input('officer_id')) {
            $query->byOfficer($officerId);
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->where('report_date', '>=', $dateFrom);
        }
        if ($dateTo = $request->input('date_to')) {
            $query->where('report_date', '<=', $dateTo);
        }

        // Sort
        $sortBy = $request->input('sort_by', 'report_date');
        $sortDir = $request->input('sort_dir', 'desc');
        $allowedSorts = ['case_number', 'reporter_name', 'report_date', 'incident_date', 'material_loss', 'status', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $cases = $query->paginate($perPage);

        return response()->json([
            'data' => CaseResource::collection($cases),
            'meta' => [
                'current_page' => $cases->currentPage(),
                'last_page' => $cases->lastPage(),
                'per_page' => $cases->perPage(),
                'total' => $cases->total(),
            ],
        ]);
    }

    public function store(StoreCaseRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['case_number'] = CaseRecord::generateCaseNumber();
        $data['created_by'] = $request->user()->id;

        if (empty($data['status'])) {
            $data['status'] = 'laporan_masuk';
        }

        $case = CaseRecord::create($data);
        $case->load(['category', 'subcategory', 'officer', 'creator']);

        AuditLog::log('created', $case, null, $case->toArray());

        return response()->json([
            'message' => 'Kasus berhasil ditambahkan.',
            'data' => new CaseResource($case),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $case = CaseRecord::with(['category', 'subcategory', 'officer', 'creator', 'updater'])
            ->findOrFail($id);

        return response()->json([
            'data' => new CaseResource($case),
        ]);
    }

    public function update(UpdateCaseRequest $request, int $id): JsonResponse
    {
        $case = CaseRecord::findOrFail($id);
        $oldValues = $case->toArray();

        $data = $request->validated();
        $data['updated_by'] = $request->user()->id;

        $case->update($data);
        $case->load(['category', 'subcategory', 'officer', 'creator', 'updater']);

        AuditLog::log('updated', $case, $oldValues, $case->toArray());

        return response()->json([
            'message' => 'Kasus berhasil diperbarui.',
            'data' => new CaseResource($case),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Anda tidak memiliki akses untuk menghapus kasus.'], 403);
        }

        $case = CaseRecord::findOrFail($id);
        $oldValues = $case->toArray();

        AuditLog::log('deleted', $case, $oldValues, null);

        $case->delete(); // soft delete

        return response()->json([
            'message' => 'Kasus berhasil dihapus.',
        ]);
    }
}
