<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CaseRecord;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month');

        // Base query
        $query = CaseRecord::query();

        if ($month) {
            $query->whereYear('report_date', $year)->whereMonth('report_date', $month);
        } else {
            $query->whereYear('report_date', $year);
        }

        // Summary statistics using DB aggregation
        $summary = (clone $query)->selectRaw("
            COUNT(*) as total_cases,
            COALESCE(SUM(material_loss), 0) as total_loss,
            COUNT(CASE WHEN status = 'laporan_masuk' THEN 1 END) as laporan_masuk,
            COUNT(CASE WHEN status = 'dalam_penyelidikan' THEN 1 END) as dalam_penyelidikan,
            COUNT(CASE WHEN status = 'dalam_penyidikan' THEN 1 END) as dalam_penyidikan,
            COUNT(CASE WHEN status = 'p21' THEN 1 END) as p21,
            COUNT(CASE WHEN status = 'sp3' THEN 1 END) as sp3,
            COUNT(CASE WHEN status = 'selesai' THEN 1 END) as selesai
        ")->first();

        // Monthly trend for the year
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $monthExp = $isSqlite ? "CAST(strftime('%m', report_date) AS INTEGER)" : "MONTH(report_date)";

        $monthlyTrend = CaseRecord::whereYear('report_date', $year)
            ->selectRaw("{$monthExp} as month, COUNT(*) as total, COALESCE(SUM(material_loss), 0) as loss")
            ->groupByRaw($monthExp)
            ->orderByRaw($monthExp)
            ->get()
            ->map(function ($item) {
                $monthNames = [
                    1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr',
                    5 => 'Mei', 6 => 'Jun', 7 => 'Jul', 8 => 'Agu',
                    9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des',
                ];
                return [
                    'month' => $item->month,
                    'month_name' => $monthNames[$item->month] ?? '',
                    'total' => $item->total,
                    'loss' => (float) $item->loss,
                ];
            });

        // Cases by category
        $byCategory = Category::withCount(['cases' => function ($q) use ($year, $month) {
            $q->whereYear('report_date', $year);
            if ($month) $q->whereMonth('report_date', $month);
        }])
        ->withSum(['cases' => function ($q) use ($year, $month) {
            $q->whereYear('report_date', $year);
            if ($month) $q->whereMonth('report_date', $month);
        }], 'material_loss')
        ->having('cases_count', '>', 0)
        ->get()
        ->map(fn ($cat) => [
            'id' => $cat->id,
            'name' => $cat->name,
            'total' => $cat->cases_count,
            'loss' => (float) ($cat->cases_sum_material_loss ?? 0),
        ]);

        // Recent cases
        $recentCases = CaseRecord::with(['category', 'subcategory', 'officer'])
            ->latest('report_date')
            ->limit(10)
            ->get()
            ->map(fn ($case) => [
                'id' => $case->id,
                'case_number' => $case->case_number,
                'reporter_name' => $case->reporter_name,
                'category' => $case->category?->name,
                'subcategory' => $case->subcategory?->name,
                'material_loss' => (float) $case->material_loss,
                'material_loss_formatted' => 'Rp ' . number_format((float) $case->material_loss, 0, ',', '.'),
                'status' => $case->status,
                'status_label' => $case->status_label,
                'report_date' => $case->report_date->format('Y-m-d'),
                'officer' => $case->officer?->name,
            ]);

        // Status distribution
        $statusDistribution = collect(CaseRecord::statusLabels())->map(function ($label, $key) use ($summary) {
            return [
                'status' => $key,
                'label' => $label,
                'total' => $summary->{$key} ?? 0,
            ];
        })->values();

        return response()->json([
            'data' => [
                'year' => (int) $year,
                'month' => $month ? (int) $month : null,
                'summary' => [
                    'total_cases' => (int) $summary->total_cases,
                    'total_loss' => (float) $summary->total_loss,
                    'total_loss_formatted' => 'Rp ' . number_format((float) $summary->total_loss, 0, ',', '.'),
                ],
                'status_distribution' => $statusDistribution,
                'monthly_trend' => $monthlyTrend,
                'by_category' => $byCategory,
                'recent_cases' => $recentCases,
            ],
        ]);
    }
}
