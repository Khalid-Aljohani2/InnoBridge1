<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserNotificationRead extends Model
{
    protected $fillable = [
        'user_id',
        'kind',
        'reference_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
