<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CaseResource;
use App\Models\CaseRecord;
use App\Models\Category;
use App\Exports\ReportExport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CaseRecord::with(['category', 'subcategory', 'officer']);

        $this->applyFilters($query, $request);

        // Summary using DB aggregation
        $summaryQuery = clone $query;
        $summary = $summaryQuery->selectRaw('
            COUNT(*) as total_cases,
            COALESCE(SUM(material_loss), 0) as total_loss
        ')->first();

        // By category
        $byCategory = Category::withCount(['cases' => function ($q) use ($request) {
            $this->applyFilters($q, $request);
        }])
        ->withSum(['cases' => function ($q) use ($request) {
            $this->applyFilters($q, $request);
        }], 'material_loss')
        ->having('cases_count', '>', 0)
        ->get()
        ->map(fn ($cat) => [
            'name' => $cat->name,
            'total' => $cat->cases_count,
            'loss' => (float) ($cat->cases_sum_material_loss ?? 0),
            'loss_formatted' => 'Rp ' . number_format((float) ($cat->cases_sum_material_loss ?? 0), 0, ',', '.'),
        ]);

        // By status
        $byStatus = collect(CaseRecord::statusLabels())->map(function ($label, $key) use ($request) {
            $count = CaseRecord::query();
            $this->applyFilters($count, $request);
            $count = $count->where('status', $key)->count();
            return [
                'status' => $key,
                'label' => $label,
                'total' => $count,
            ];
        })->values();

        // Case list
        $perPage = min((int) $request->input('per_page', 15), 100);
        $cases = $query->latest('report_date')->paginate($perPage);

        return response()->json([
            'data' => [
                'summary' => [
                    'total_cases' => (int) $summary->total_cases,
                    'total_loss' => (float) $summary->total_loss,
                    'total_loss_formatted' => 'Rp ' . number_format((float) $summary->total_loss, 0, ',', '.'),
                ],
                'by_category' => $byCategory,
                'by_status' => $byStatus,
                'cases' => CaseResource::collection($cases),
            ],
            'meta' => [
                'current_page' => $cases->currentPage(),
                'last_page' => $cases->lastPage(),
                'per_page' => $cases->perPage(),
                'total' => $cases->total(),
            ],
        ]);
    }

    public function export(Request $request)
    {
        $format = $request->input('format', 'xlsx');

        $query = CaseRecord::with(['category', 'subcategory', 'officer']);
        $this->applyFilters($query, $request);
        $cases = $query->latest('report_date')->get();

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('exports.report', [
                'cases' => $cases,
                'filters' => $this->getFilterSummary($request),
                'total_cases' => $cases->count(),
                'total_loss' => $cases->sum('material_loss'),
            ]);
            $pdf->setPaper('A4', 'landscape');

            return $pdf->download('laporan-kasus-' . now()->format('Y-m-d') . '.pdf');
        }

        // Default: Excel
        return Excel::download(
            new ReportExport($cases),
            'laporan-kasus-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    private function applyFilters($query, Request $request): void
    {
        if ($dateFrom = $request->input('date_from')) {
            $query->where('report_date', '>=', $dateFrom);
        }
        if ($dateTo = $request->input('date_to')) {
            $query->where('report_date', '<=', $dateTo);
        }
        if ($categoryId = $request->input('category_id')) {
            $query->where('category_id', $categoryId);
        }
        if ($subcategoryId = $request->input('subcategory_id')) {
            $query->where('subcategory_id', $subcategoryId);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($officerId = $request->input('officer_id')) {
            $query->where('officer_id', $officerId);
        }
    }

    private function getFilterSummary(Request $request): array
    {
        return [
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'category_id' => $request->input('category_id'),
            'subcategory_id' => $request->input('subcategory_id'),
            'status' => $request->input('status'),
            'officer_id' => $request->input('officer_id'),
        ];
    }
}
