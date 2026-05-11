<?php

return [
    /*
    | HoD → student teams (عند عدم الترشيح للشركة)
    */
    'hod_student_messages' => [
        'not_nominated_efficiency' => [
            'ar' => 'بناءً على معايير الكفاءة، تم ترشيح فريق آخر لهذا التحدي.',
            'en' => 'Based on competency criteria, another team has been nominated for this challenge.',
        ],
    ],

    /*
    | Company rejection → يُرسَم تلقائياً للفرق المتأثرة
    */
    'company_reject_messages' => [
        'challenge_reopened' => [
            'ar' => 'نحيطكم علماً بأن الشركة فضلت عدم المضي قدماً مع الطلب الحالي، وسيعود التحدي للمنافسة.',
            'en' => 'Please note that the company chose not to proceed with this application; the challenge will return to open competition.',
        ],
    ],

    /*
    | Legacy / فريق آخر فاز بعد اعتماد الشركة
    */
    'hod_apologies' => [
        'company_picked_other' => [
            'ar' => 'نعتذر لكم، لقد اختارت الشركة فريقاً آخر لهذا التحدي، وتم إلغاء الطلب من طرفكم.',
            'en' => 'We are sorry—the company chose another team for this challenge and your application has been closed.',
        ],
    ],
];
