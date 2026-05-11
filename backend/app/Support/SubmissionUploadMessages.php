<?php

namespace App\Support;

use App\Models\User;

class SubmissionUploadMessages
{
    /**
     * Custom validation messages for milestone submission file rules (mimes, max, required).
     *
     * @return array<string, string>
     */
    public static function forUser(?User $user = null): array
    {
        $ar = ($user?->preferred_language ?? 'en') === 'ar';

        if ($ar) {
            return [
                'file.required' => 'يرجى اختيار ملف للرفع. الصيغ المسموحة: PDF، Word (.doc أو .docx)، أو ZIP (حتى 20 ميجابايت).',
                'file.mimes' => 'صيغة الملف غير مدعومة. الصيغ المسموحة: PDF، Word (.doc أو .docx)، أو ZIP (حتى 20 ميجابايت).',
                'file.max' => 'حجم الملف يتجاوز الحد المسموح (20 ميجابايت). الصيغ المسموحة: PDF، Word (.doc أو .docx)، أو ZIP.',
            ];
        }

        return [
            'file.required' => 'Please choose a file to upload. Allowed formats: PDF, Microsoft Word (.doc, .docx), or ZIP, up to 20 MB.',
            'file.mimes' => 'This file type is not allowed. Allowed formats: PDF, Microsoft Word (.doc, .docx), or ZIP, up to 20 MB.',
            'file.max' => 'This file is too large. Maximum size is 20 MB. Allowed formats: PDF, Word (.doc, .docx), or ZIP.',
        ];
    }
}
