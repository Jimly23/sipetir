<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Kasus</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; }
        h1 { text-align: center; font-size: 16px; margin-bottom: 5px; }
        .meta { text-align: center; margin-bottom: 15px; font-size: 11px; color: #555; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; }
        th { background-color: #2c3e50; color: #fff; font-weight: bold; }
        tr:nth-child(even) td { background-color: #f9f9f9; }
        .summary { margin-top: 15px; font-size: 11px; }
        .summary p { margin: 3px 0; }
        .text-right { text-align: right; }
        .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #999; }
    </style>
</head>
<body>
    <h1>LAPORAN REKAPITULASI KASUS</h1>
    <div class="meta">
        Dicetak pada: {{ now()->format('d/m/Y H:i') }} WIB
        @if($filters['date_from'] || $filters['date_to'])
            <br>Periode: {{ $filters['date_from'] ?? '-' }} s/d {{ $filters['date_to'] ?? '-' }}
        @endif
    </div>

    <div class="summary">
        <p><strong>Total Kasus:</strong> {{ $total_cases }}</p>
        <p><strong>Total Kerugian Material:</strong> Rp {{ number_format($total_loss, 0, ',', '.') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>No. Kasus</th>
                <th>Tgl Laporan</th>
                <th>Pelapor</th>
                <th>Kategori</th>
                <th>Subkategori</th>
                <th>Kerugian (Rp)</th>
                <th>Status</th>
                <th>Petugas</th>
            </tr>
        </thead>
        <tbody>
            @forelse($cases as $index => $case)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $case->case_number }}</td>
                <td>{{ $case->report_date?->format('d/m/Y') }}</td>
                <td>{{ $case->reporter_name }}</td>
                <td>{{ $case->category?->name ?? '-' }}</td>
                <td>{{ $case->subcategory?->name ?? '-' }}</td>
                <td class="text-right">{{ number_format((float) $case->material_loss, 0, ',', '.') }}</td>
                <td>{{ \App\Models\CaseRecord::statusLabels()[$case->status] ?? $case->status }}</td>
                <td>{{ $case->officer?->name ?? '-' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="9" style="text-align: center;">Tidak ada data kasus.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Dokumen ini dihasilkan secara otomatis oleh Sistem Sipetir (Sistem Pendataan Tipidter).
    </div>
</body>
</html>
