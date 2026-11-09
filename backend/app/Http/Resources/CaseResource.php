<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'case_number' => $this->case_number,
            'reporter_name' => $this->reporter_name,
            'reporter_gender' => $this->reporter_gender,
            'reporter_age' => $this->reporter_age,
            'reporter_occupation' => $this->reporter_occupation,
            'category_id' => $this->category_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'subcategory_id' => $this->subcategory_id,
            'subcategory' => new SubcategoryResource($this->whenLoaded('subcategory')),
            'material_loss' => (float) $this->material_loss,
            'material_loss_formatted' => 'Rp ' . number_format((float) $this->material_loss, 0, ',', '.'),
            'incident_date' => $this->incident_date?->format('Y-m-d'),
            'report_date' => $this->report_date?->format('Y-m-d'),
            'description' => $this->description,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'officer_id' => $this->officer_id,
            'officer' => new UserResource($this->whenLoaded('officer')),
            'created_by' => $this->created_by,
            'creator' => new UserResource($this->whenLoaded('creator')),
            'updated_by' => $this->updated_by,
            'updater' => new UserResource($this->whenLoaded('updater')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
