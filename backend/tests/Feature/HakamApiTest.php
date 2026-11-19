<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\CaseRecord;
use App\Models\User;
use Tests\TestCase;

class HakamApiTest extends TestCase
{
    public function test_login_validation_and_success(): void
    {
        // Validation failure
        $res = $this->postJson('/api/login', []);
        $res->assertStatus(422);

        // Invalid credentials
        $res = $this->postJson('/api/login', [
            'email' => 'admin@gmail.com',
            'password' => 'wrongpassword',
        ]);
        $res->assertStatus(401);

        // Valid credentials
        $res = $this->postJson('/api/login', [
            'email' => 'admin@gmail.com',
            'password' => 'password123',
        ]);
        $res->assertStatus(200);
        $res->assertJsonStructure([
            'message',
            'data' => [
                'user' => ['id', 'name', 'email', 'role', 'is_active'],
                'token',
            ],
        ]);
    }

    public function test_dashboard_endpoint(): void
    {
        $admin = User::where('role', 'admin')->first();
        $this->actingAs($admin, 'sanctum');

        $res = $this->getJson('/api/dashboard?year=2024');
        $res->assertStatus(200);
        $res->assertJsonStructure([
            'data' => [
                'year',
                'summary' => ['total_cases', 'total_loss', 'total_loss_formatted'],
                'status_distribution',
                'monthly_trend',
                'by_category',
                'recent_cases',
            ],
        ]);
    }

    public function test_cases_listing_and_filter(): void
    {
        $penyidik = User::where('role', 'penyidik')->first();
        $this->actingAs($penyidik, 'sanctum');

        $res = $this->getJson('/api/cases?per_page=5');
        $res->assertStatus(200);
        $res->assertJsonStructure([
            'data' => [
                '*' => [
                    'id', 'case_number', 'reporter_name', 'material_loss',
                    'material_loss_formatted', 'status', 'status_label',
                ]
            ],
            'meta' => ['current_page', 'last_page', 'total'],
        ]);
    }

    public function test_penyidik_auto_assigns_officer_and_cannot_change_it(): void
    {
        $penyidik = User::where('role', 'penyidik')->first();
        $penyidik2 = User::where('role', 'penyidik')->where('id', '!=', $penyidik->id)->first();
        $this->actingAs($penyidik, 'sanctum');

        $category = Category::with('subcategories')->first();
        $subcategory = $category->subcategories->first();

        // 1. Saat penyidik input kasus, officer_id otomatis akun penyidik tersebut
        $createRes = $this->postJson('/api/cases', [
            'reporter_name' => 'Pelapor Penyidik Auto',
            'category_id' => $category->id,
            'subcategory_id' => $subcategory->id,
            'material_loss' => 1000000,
            'incident_date' => '2024-01-01',
            'report_date' => '2024-01-02',
            'officer_id' => $penyidik2 ? $penyidik2->id : null, // Coba set orang lain
        ]);
        $createRes->assertStatus(201);
        $caseId = $createRes->json('data.id');
        // Harus tetap bernilai id dari penyidik yang sedang login
        $this->assertEquals($penyidik->id, $createRes->json('data.officer.id'));

        // 2. Saat penyidik update kasus, tidak bisa mengubah petugas penangan
        if ($penyidik2) {
            $updateRes = $this->putJson('/api/cases/' . $caseId, [
                'reporter_name' => 'Pelapor Penyidik Auto (Updated)',
                'officer_id' => $penyidik2->id,
            ]);
            $updateRes->assertStatus(200);
            $this->assertEquals($penyidik->id, $updateRes->json('data.officer.id'));
        }
    }

    public function test_admin_and_pimpinan_can_assign_penyidik_to_case(): void
    {
        $admin = User::where('role', 'admin')->first();
        $pimpinan = User::where('role', 'pimpinan')->first();
        $penyidik = User::where('role', 'penyidik')->first();
        $penyidik2 = User::where('role', 'penyidik')->where('id', '!=', $penyidik->id)->first();

        $category = Category::with('subcategories')->first();
        $subcategory = $category->subcategories->first();

        // Admin create case and assign to penyidik 1
        $this->actingAs($admin, 'sanctum');
        $createRes = $this->postJson('/api/cases', [
            'reporter_name' => 'Kasus Penugasan',
            'category_id' => $category->id,
            'subcategory_id' => $subcategory->id,
            'material_loss' => 5000000,
            'incident_date' => '2024-02-01',
            'report_date' => '2024-02-02',
            'officer_id' => $penyidik->id,
        ]);
        $createRes->assertStatus(201);
        $caseId = $createRes->json('data.id');
        $this->assertEquals($penyidik->id, $createRes->json('data.officer.id'));

        // Pimpinan ganti penunjukan penyidik ke penyidik 2
        if ($penyidik2) {
            $this->actingAs($pimpinan, 'sanctum');
            $assignRes = $this->putJson('/api/cases/' . $caseId, [
                'officer_id' => $penyidik2->id,
            ]);
            $assignRes->assertStatus(200);
            $this->assertEquals($penyidik2->id, $assignRes->json('data.officer.id'));
        }
    }

    public function test_admin_can_create_and_delete_case(): void
    {
        $admin = User::where('role', 'admin')->first();
        $this->actingAs($admin, 'sanctum');

        $category = Category::with('subcategories')->first();
        $subcategory = $category->subcategories->first();

        $createRes = $this->postJson('/api/cases', [
            'reporter_name' => 'Pelapor Uji Coba',
            'reporter_gender' => 'laki-laki',
            'reporter_age' => 30,
            'reporter_occupation' => 'Wiraswasta',
            'category_id' => $category->id,
            'subcategory_id' => $subcategory->id,
            'material_loss' => 2500000,
            'incident_date' => '2024-01-10',
            'report_date' => '2024-01-11',
            'description' => 'Kronologi kasus uji coba',
            'status' => 'laporan_masuk',
        ]);
        $createRes->assertStatus(201);
        $caseId = $createRes->json('data.id');

        // Delete (admin only)
        $delRes = $this->deleteJson('/api/cases/' . $caseId);
        $delRes->assertStatus(200);
    }

    public function test_reports_endpoint(): void
    {
        $admin = User::where('role', 'admin')->first();
        $this->actingAs($admin, 'sanctum');

        $res = $this->getJson('/api/reports');
        $res->assertStatus(200);
        $res->assertJsonStructure([
            'data' => [
                'summary',
                'by_category',
                'by_status',
                'cases',
            ],
            'meta',
        ]);
    }

    public function test_reports_export_excel_and_pdf(): void
    {
        $admin = User::where('role', 'admin')->first();
        $this->actingAs($admin, 'sanctum');

        // Test Excel export
        $excelRes = $this->get('/api/reports/export?format=xlsx');
        $excelRes->assertStatus(200);
        $this->assertStringContainsString('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', (string) $excelRes->headers->get('content-type'));

        // Test PDF export
        $pdfRes = $this->get('/api/reports/export?format=pdf');
        $pdfRes->assertStatus(200);
        $this->assertStringContainsString('application/pdf', (string) $pdfRes->headers->get('content-type'));
    }
}
