<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\CaseRecord;
use App\Models\Subcategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ============ USERS ============
        $admin = User::create([
            'name' => 'Administrator',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $pimpinan = User::create([
            'name' => 'Kepala Divisi',
            'email' => 'pimpinan@gmail.com',
            'password' => Hash::make('password123'),
            'role' => 'pimpinan',
            'is_active' => true,
        ]);

        $operator = User::create([
            'name' => 'Operator Satu',
            'email' => 'operator@gmail.com',
            'password' => Hash::make('password123'),
            'role' => 'operator',
            'is_active' => true,
        ]);

        $penyidik = User::create([
            'name' => 'Penyidik Utama',
            'email' => 'penyidik@gmail.com',
            'password' => Hash::make('password123'),
            'role' => 'penyidik',
            'is_active' => true,
        ]);

        // ============ CATEGORIES & SUBCATEGORIES ============
        $penipuan = Category::create([
            'name' => 'Penipuan (Scam)',
            'slug' => 'penipuan-scam',
            'description' => 'Kasus penipuan melalui berbagai modus operandi digital.',
        ]);
        $penipuanSubs = [
            ['name' => 'E-Commerce', 'slug' => 'e-commerce', 'description' => 'Penipuan melalui platform jual beli online.'],
            ['name' => 'Investasi Bodong', 'slug' => 'investasi-bodong', 'description' => 'Penipuan berkedok investasi.'],
            ['name' => 'Lowongan Kerja Fiktif', 'slug' => 'lowongan-kerja-fiktif', 'description' => 'Penipuan berkedok lowongan pekerjaan.'],
            ['name' => 'Lainnya', 'slug' => 'lainnya', 'description' => 'Modus penipuan lainnya.'],
        ];
        foreach ($penipuanSubs as $sub) {
            $penipuan->subcategories()->create($sub);
        }

        $ancaman = Category::create([
            'name' => 'Ancaman',
            'slug' => 'ancaman',
            'description' => 'Kasus ancaman dan pemerasan digital.',
        ]);
        $ancamanSubs = [
            ['name' => 'Pemerasan', 'slug' => 'pemerasan', 'description' => 'Ancaman disertai permintaan uang atau keuntungan.'],
            ['name' => 'Pencemaran Nama Baik', 'slug' => 'pencemaran-nama-baik', 'description' => 'Ancaman pencemaran nama baik.'],
            ['name' => 'Penyebaran Data Pribadi', 'slug' => 'penyebaran-data-pribadi', 'description' => 'Ancaman penyebaran data pribadi.'],
        ];
        foreach ($ancamanSubs as $sub) {
            $ancaman->subcategories()->create($sub);
        }

        $pencemaran = Category::create([
            'name' => 'Pencemaran Nama Baik',
            'slug' => 'pencemaran-nama-baik',
            'description' => 'Penghinaan atau pencemaran melalui media sosial/platform digital.',
        ]);
        $pencemaranSubs = [
            ['name' => 'Penghinaan via Media Sosial', 'slug' => 'penghinaan-media-sosial', 'description' => 'Penghinaan melalui platform media sosial.'],
            ['name' => 'Pencemaran via Platform Digital', 'slug' => 'pencemaran-platform-digital', 'description' => 'Pencemaran nama baik melalui platform digital lainnya.'],
        ];
        foreach ($pencemaranSubs as $sub) {
            $pencemaran->subcategories()->create($sub);
        }

        $dataPribadi = Category::create([
            'name' => 'Penyebaran Data Pribadi',
            'slug' => 'penyebaran-data-pribadi',
            'description' => 'Doxing atau pembocoran data/dokumen pribadi.',
        ]);
        $dataPribadiSubs = [
            ['name' => 'Doxing', 'slug' => 'doxing', 'description' => 'Penyebaran informasi pribadi tanpa izin.'],
            ['name' => 'Pembocoran Dokumen Pribadi', 'slug' => 'pembocoran-dokumen', 'description' => 'Pembocoran dokumen atau data pribadi.'],
        ];
        foreach ($dataPribadiSubs as $sub) {
            $dataPribadi->subcategories()->create($sub);
        }

        // ============ SAMPLE CASES (FIKTIF) ============
        $allSubcategories = Subcategory::all();
        $officers = [$operator, $penyidik, $admin];
        $statuses = ['laporan_masuk', 'dalam_penyelidikan', 'dalam_penyidikan', 'p21', 'sp3', 'selesai'];
        $genders = ['laki-laki', 'perempuan'];
        $occupations = ['Wiraswasta', 'PNS', 'Karyawan Swasta', 'Mahasiswa', 'Ibu Rumah Tangga', 'Pedagang', 'Freelancer'];

        $sampleCases = [
            ['Budi Santoso', 'laki-laki', 35, 'Wiraswasta', 1, 1, 15000000, '2024-01-15', '2024-01-20', 'Korban tertipu oleh toko online fiktif.'],
            ['Siti Aminah', 'perempuan', 28, 'Karyawan Swasta', 1, 2, 50000000, '2024-02-10', '2024-02-12', 'Investasi bodong dengan skema ponzi.'],
            ['Andi Pratama', 'laki-laki', 42, 'PNS', 1, 3, 5000000, '2024-03-05', '2024-03-07', 'Lowongan kerja fiktif meminta biaya pendaftaran.'],
            ['Dewi Lestari', 'perempuan', 31, 'Pedagang', 2, 5, 20000000, '2024-03-20', '2024-03-22', 'Pemerasan melalui ancaman penyebaran foto.'],
            ['Rudi Hermawan', 'laki-laki', 45, 'Wiraswasta', 2, 6, 0, '2024-04-10', '2024-04-12', 'Pencemaran nama baik melalui media sosial.'],
            ['Mega Putri', 'perempuan', 22, 'Mahasiswa', 3, 8, 0, '2024-04-25', '2024-04-27', 'Penghinaan di platform media sosial.'],
            ['Fajar Nugroho', 'laki-laki', 38, 'Karyawan Swasta', 4, 10, 0, '2024-05-15', '2024-05-17', 'Doxing data pribadi di forum online.'],
            ['Yuni Kartika', 'perempuan', 33, 'Ibu Rumah Tangga', 1, 1, 8500000, '2024-06-01', '2024-06-03', 'Penipuan e-commerce barang tidak dikirim.'],
            ['Hendra Wijaya', 'laki-laki', 50, 'Wiraswasta', 1, 4, 100000000, '2024-06-20', '2024-06-22', 'Penipuan modus lain dengan kerugian besar.'],
            ['Lina Mariana', 'perempuan', 27, 'Freelancer', 2, 7, 10000000, '2024-07-05', '2024-07-07', 'Ancaman penyebaran data pribadi korban.'],
            ['Agus Setiawan', 'laki-laki', 40, 'PNS', 3, 9, 0, '2024-07-20', '2024-07-22', 'Pencemaran via platform digital.'],
            ['Ratna Sari', 'perempuan', 29, 'Karyawan Swasta', 4, 11, 0, '2024-08-10', '2024-08-12', 'Pembocoran dokumen pribadi.'],
            ['Doni Firmansyah', 'laki-laki', 36, 'Pedagang', 1, 2, 25000000, '2024-08-25', '2024-08-27', 'Investasi bodong cryptocurrency palsu.'],
            ['Sri Wahyuni', 'perempuan', 44, 'Wiraswasta', 1, 1, 12000000, '2024-09-10', '2024-09-12', 'Penipuan e-commerce produk palsu.'],
            ['Bambang Suryadi', 'laki-laki', 55, 'PNS', 2, 5, 30000000, '2024-09-25', '2024-09-27', 'Pemerasan oleh pelaku tidak dikenal.'],
            ['Indah Permata', 'perempuan', 25, 'Mahasiswa', 3, 8, 0, '2024-10-05', '2024-10-07', 'Penghinaan di media sosial terkait SARA.'],
            ['Ahmad Fauzi', 'laki-laki', 32, 'Freelancer', 1, 3, 7500000, '2024-10-20', '2024-10-22', 'Penipuan lowongan kerja online.'],
            ['Nur Hasanah', 'perempuan', 38, 'Ibu Rumah Tangga', 4, 10, 0, '2024-11-05', '2024-11-07', 'Doxing data keluarga.'],
            ['Rizky Maulana', 'laki-laki', 29, 'Karyawan Swasta', 1, 4, 45000000, '2024-11-20', '2024-11-22', 'Penipuan modus romance scam.'],
            ['Diana Kusuma', 'perempuan', 41, 'Pedagang', 2, 6, 0, '2024-12-05', '2024-12-07', 'Ancaman pencemaran nama baik.'],
        ];

        foreach ($sampleCases as $i => $data) {
            CaseRecord::create([
                'case_number' => 'KS-2024' . str_pad($i < 3 ? 1 : ($i < 5 ? intdiv($i, 2) + 1 : intdiv($i, 2)), 2, '0', STR_PAD_LEFT) . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                'reporter_name' => $data[0],
                'reporter_gender' => $data[1],
                'reporter_age' => $data[2],
                'reporter_occupation' => $data[3],
                'category_id' => $data[4],
                'subcategory_id' => $data[5],
                'material_loss' => $data[6],
                'incident_date' => $data[7],
                'report_date' => $data[8],
                'description' => $data[9],
                'status' => $statuses[$i % count($statuses)],
                'officer_id' => $officers[$i % count($officers)]->id,
                'created_by' => $admin->id,
            ]);
        }
    }
}
