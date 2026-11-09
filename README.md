# SIPETIR - Sistem Pendataan Tipidter (Tindak Pidana Tertentu)

Aplikasi web internal profesional untuk institusi penegak hukum dan instansi terkait guna mengelola registrasi berkas kasus tindak pidana tertentu (Tipidter), memantau statistik bulanan real-time, mengelola kategori kejahatan & modus operandi, mengunduh rekapitulasi laporan (PDF & Excel), serta manajemen peran dan hak akses pengguna.

---

## 👥 Akun Demo untuk Pengujian Lokal

Semua akun menggunakan kata sandi: `password123`

| Role | Nama Akun | Alamat Email | Hak Akses Utama |
|---|---|---|---|
| **Admin** | Administrator | `admin@gmail.com` | Akses penuh: Kelola pengguna, kategori, tambah/edit/hapus kasus, lihat dashboard & laporan. |
| **Pimpinan** | Kepala Divisi | `pimpinan@gmail.com` | Akses baca (*Read-only*): Dashboard statistik, seluruh data kasus, dan rekapitulasi laporan (tidak dapat mengubah data). |
| **Operator** | Operator Satu | `operator@gmail.com` | Registrasi kasus baru, perbarui data kasus, lihat dashboard dan laporan. |
| **Penyidik** | Penyidik Utama | `penyidik@gmail.com` | Penanganan berkas perkara, ubah status/tahapan penyidikan, input kronologi, edit data kasus. |

> **Catatan Pengujian:** Pada halaman login terdapat tombol cepat (*One-Click Demo Helper*) untuk langsung mengisi kredensial masing-masing role tanpa perlu mengetik manual.

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Prasyarat
- **XAMPP / MySQL**: Pastikan Apache & MySQL berjalan di port `3306`. Database `hakam_db` sudah dibuat dan dimigrasi.
- **PHP**: PHP 8.3+
- **Composer** & **Node.js**: v20+

### 2. Backend (Laravel 13)
```bash
cd backend

# Salin konfigurasi environment jika belum ada
cp .env.example .env

# Jalankan migrasi dan seed data demo (jika ingin reset)
php artisan migrate:fresh --seed

# Jalankan automated test suite (7 pengujian lengkap, status pass)
php artisan test --filter=HakamApiTest

# Jalankan server API
php artisan serve --port=8000
```
Server backend berjalan pada: `http://127.0.0.1:8000`

### 3. Frontend (React 19 + TypeScript + Vite + Tailwind CSS v4)
```bash
cd frontend

# Install dependensi (jika diperlukan)
npm install

# Build produksi
npm run build

# Jalankan development server
npm run dev -- --host 127.0.0.1 --port 5173
```
Aplikasi frontend dapat diakses melalui browser di: `http://127.0.0.1:5173`

---

## 📡 Dokumentasi Endpoint REST API

Semua endpoint dilindungi dengan middleware `auth:sanctum` (mengirimkan header `Authorization: Bearer <token>`), kecuali endpoint `POST /api/login`.

| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|---|---|
| `POST` | `/api/login` | Publik | Autentikasi pengguna & perolehan token Sanctum (Rate limit: 5 req/menit) |
| `POST` | `/api/logout` | Authenticated | Revoke token aktif dan keluar dari sesi |
| `GET` | `/api/me` | Authenticated | Mendapatkan profil pengguna yang sedang login |
| `GET` | `/api/dashboard` | All Roles | Statistik agregasi database (total kasus, total kerugian, tren bulanan, kategori, status) |
| `GET` | `/api/cases` | All Roles | Daftar kasus dengan server-side pagination, search & multi-filter |
| `POST` | `/api/cases` | Admin, Operator, Penyidik | Registrasi berkas kasus baru (Nomor kasus otomatis `KS-YYYYMM-XXXX`) |
| `GET` | `/api/cases/{id}` | All Roles | Detail lengkap berkas perkara, profil pelapor, penugasan, dan audit trail |
| `PUT/PATCH` | `/api/cases/{id}` | Admin, Operator, Penyidik | Pembaruan data perkara dan pencatatan riwayat perubahan |
| `DELETE` | `/api/cases/{id}` | Admin | Soft delete berkas kasus dan pencatatan audit log |
| `GET` | `/api/categories` | All Roles | Daftar kategori kejahatan beserta subkategori aktif |
| `POST` | `/api/categories` | Admin | Menambah kategori kejahatan baru |
| `PUT` | `/api/categories/{id}` | Admin | Memperbarui nama dan deskripsi kategori |
| `DELETE` | `/api/categories/{id}` | Admin | Menghapus kategori (ditolak jika memiliki kasus terkait) |
| `POST` | `/api/categories/{id}/subcategories` | Admin | Menambah subkategori / modus baru pada kategori tertentu |
| `DELETE` | `/api/categories/{id}/subcategories/{subId}` | Admin | Menghapus subkategori (ditolak jika memiliki kasus terkait) |
| `GET` | `/api/reports` | All Roles | Rekapitulasi laporan berdasarkan filter periode, status, dan petugas |
| `GET` | `/api/reports/export?format=xlsx\|pdf` | All Roles | Unduh berkas rekapitulasi resmi dalam format Excel (.xlsx) atau PDF (.pdf) |
| `GET` | `/api/users` | Admin | Daftar seluruh pengguna terdaftar dengan paginasi |
| `POST` | `/api/users` | Admin | Menambah akun personel baru beserta penetapan perannya |
| `GET` | `/api/users/{id}` | Admin | Mengambil rincian akun pengguna |
| `PUT` | `/api/users/{id}` | Admin | Memperbarui profil pengguna, status aktif, atau kata sandi |
| `GET` | `/api/officers` | All Roles | Mengambil daftar petugas aktif untuk dropdown penugasan berkas |

---

## 🔒 Praktik Keamanan & Arsitektur Backend
1. **Sanctum Token Authentication**: Token berbasis hash sha256 tersimpan di database (`personal_access_tokens`), diproteksi dari pembajakan sesi.
2. **Rate Limiting**: Endpoint login dibatasi maksimal 5 percobaan per menit per IP untuk mencegah serangan *brute force*.
3. **Data Sanitization & Prepared Statements**: Semua query menggunakan Eloquent ORM & Query Builder dengan *parameter binding*, mencegah SQL Injection.
4. **Zero Password Leak**: Password hash disembunyikan menggunakan `$hidden` di model `User` dan tidak pernah dikembalikan dalam respon API apa pun.
5. **Database Aggregation**: Perhitungan metrik, tren bulanan, dan total kerugian material dihitung langsung menggunakan query SQL agregasi (`COUNT`, `SUM`, `GROUP BY`), tanpa memuat ribuan baris data ke memori PHP/frontend.
6. **Soft Deleting & Audit Trail**: Kasus menggunakan `SoftDeletes` dan setiap aksi *create*, *update*, atau *delete* dicatat dalam tabel `audit_logs` (mencatat user_id, action, old_values, new_values, IP address, dan user agent).

---

## 📋 Daftar Asumsi untuk Dikonfirmasi dengan Pihak Terkait

1. **Definisi Alur Status Kasus**:
   - Status saat ini mengacu pada standar proses perkara pidana di Indonesia:
     `laporan_masuk` → `dalam_penyelidikan` → `dalam_penyidikan` → `p21` (berkas lengkap) / `sp3` (penghentian penyidikan) / `selesai`.
   - *Perlu konfirmasi*: Apakah ada alur status tambahan yang spesifik untuk instansi (misal: *Restorative Justice / Mediasi*, *Pelimpahan ke Pengadilan*, atau *Tindak Pidana Khusus*)?
2. **Format Identitas Unik / Nomor Berkas Perkara**:
   - Format standar saat ini: `KS-YYYYMM-XXXX` (contoh: `KS-202401-0001`).
   - *Perlu konfirmasi*: Apakah instansi memerlukan format penomoran resmi instansi seperti `LP/B/XXXX/MM/YYYY/SPKT/...`?
3. **Kebijakan Retensi Data & Penghapusan**:
   - Saat ini penghapusan kasus bersifat *Soft Delete* (data tidak langsung hilang dari database) dan hanya dapat dilakukan oleh role **Admin**.
   - *Perlu konfirmasi*: Berapa lama retensi data kasus sebelum dapat di-*force delete* permanen atau diarsipkan ke *cold storage*?
4. **Ketentuan Hak Akses Per Wilayah / Unit Kerja**:
   - Saat ini pembagian hak akses bersifat fungsional berbasis Role di seluruh data (Admin, Pimpinan, Operator, Penyidik).
   - *Perlu konfirmasi*: Apakah di masa depan perlu ditambahkan pemisahan multi-wilayah/unit (misal: Subdit 1, Subdit 2, Polda/Polres, atau batas wilayah administratif)?
