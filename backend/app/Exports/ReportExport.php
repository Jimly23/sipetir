<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReportExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected Collection $cases;

    public function __construct(Collection $cases)
    {
        $this->cases = $cases;
    }

    public function collection(): Collection
    {
        return $this->cases;
    }

    public function headings(): array
    {
        return [
            'No',
            'Nomor Kasus',
            'Tanggal Laporan',
            'Tanggal Kejadian',
            'Nama Pelapor',
            'Gender',
            'Umur',
            'Pekerjaan',
            'Kategori',
            'Subkategori',
            'Kerugian Material (Rp)',
            'Status',
            'Petugas',
            'Kronologi',
        ];
    }

    public function map($case): array
    {
        static $no = 0;
        $no++;

        $statusLabels = \App\Models\CaseRecord::statusLabels();

        return [
            $no,
            $case->case_number,
            $case->report_date?->format('d/m/Y'),
            $case->incident_date?->format('d/m/Y'),
            $case->reporter_name,
            $case->reporter_gender === 'laki-laki' ? 'Laki-laki' : ($case->reporter_gender === 'perempuan' ? 'Perempuan' : '-'),
            $case->reporter_age ?? '-',
            $case->reporter_occupation ?? '-',
            $case->category?->name ?? '-',
            $case->subcategory?->name ?? '-',
            number_format((float) $case->material_loss, 0, ',', '.'),
            $statusLabels[$case->status] ?? $case->status,
            $case->officer?->name ?? '-',
            $case->description ?? '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
