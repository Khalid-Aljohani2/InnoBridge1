<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class University extends Model
{
    // الحقول المسموح بإدخال بيانات فيها
    protected $fillable = ['name', 'email_domain', 'is_active'];

    // العلاقة: الجامعة الواحدة لديها العديد من المستخدمين
    public function users()
    {
        return $this->hasMany(User::class);
    }
}