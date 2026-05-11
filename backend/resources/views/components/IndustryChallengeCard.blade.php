@php
    $categoryValue = $category ?? ($challenge->category ?? null) ?? 'Unclassified';
@endphp

<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="mb-3 flex items-start justify-between gap-3">
        <h3 class="text-lg font-bold text-slate-900">
            {{ $challenge->title ?? 'Project Challenge' }}
        </h3>
        <span class="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {{ $categoryValue }}
        </span>
    </div>

    @if (!empty($challenge->description))
        <p class="text-sm leading-6 text-slate-600">
            {{ $challenge->description }}
        </p>
    @endif
</div>
