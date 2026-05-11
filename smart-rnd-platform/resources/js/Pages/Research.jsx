import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Research() {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Smart R&D Projects
                </h2>
            }
        >
            <Head title="Research" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold text-blue-700 mb-2">مرحباً بك في منصة الأبحاث الذكية</h3>
                        <p className="text-gray-600">هنا سيتمكن الطلاب والشركات من إدارة مشاريع التخرج المشتركة.</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}