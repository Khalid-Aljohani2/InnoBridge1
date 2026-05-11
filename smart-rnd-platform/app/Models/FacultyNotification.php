<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FacultyNotification extends Model
{
    protected $fillable = [
        'recipient_user_id',
        'title',
        'message',
        'is_read',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
        ];
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }
}
