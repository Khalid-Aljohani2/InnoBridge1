import { Link } from '@inertiajs/react';
import { BookOpen, Briefcase, Lightbulb } from 'lucide-react';
export default function MarketingFooter({ isArabic, isDark }) {
    const t = isArabic
        ? {
              brand: 'جسر الابتكار',
              brandEn: 'InnoBridge',
              subSlogan: 'بوابتكم لتحويل تحديات الأعمال إلى أصول ابتكارية.',
              quickTitle: 'روابط سريعة',
              quickCompany: 'انضم كشركة',
              quickStudent: 'ابدأ مشروعك',
              quickRd: 'دليل الـ R&D',
              copy: 'جميع الحقوق محفوظة.',
          }
        : {
              brand: 'Innovation Bridge',
              brandEn: 'InnoBridge',
              subSlogan: 'Your gateway to turning business challenges into innovation assets.',
              quickTitle: 'Quick links',
              quickCompany: 'Join as a company',
              quickStudent: 'Start your project',
              quickRd: 'R&D guide',
              copy: 'All rights reserved.',
          };

    const card = isDark ? 'border-slate-700/80 bg-slate-900/50' : 'border-slate-200/90 bg-white/60';

    return (
        <footer
            className={`mt-auto w-full border-t ${isDark ? 'border-slate-800 bg-slate-950/90' : 'border-slate-200 bg-slate-50/95'}`}
        >
            <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
                <div className="grid gap-10 md:grid-cols-2 md:gap-14">
                    <div>
                        <p className={`text-2xl font-black ${isDark ? 'text-slate-100' : 'text-[#0B2447]'}`}>
                            {isArabic ? (
                                <>
                                    {t.brand}
                                    <span className="mx-2 font-semibold text-[#19A7CE]">|</span>
                                    <span className="text-[#19A7CE]">{t.brandEn}</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-[#19A7CE]">{t.brandEn}</span>
                                    <span className="mx-2 font-semibold text-slate-400">|</span>
                                    {t.brand}
                                </>
                            )}
                        </p>
                        <p className={`mt-3 max-w-md text-sm leading-relaxed md:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {t.subSlogan}
                        </p>
                    </div>

                    <div className={`rounded-2xl border p-5 ${card}`}>
                        <p className={`mb-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            {t.quickTitle}
                        </p>
                        <ul className="flex flex-col gap-2">
                            <li>
                                <Link
                                    href={route('register', { role: 'industry' })}
                                    className={`inline-flex items-center gap-2 text-sm font-bold underline-offset-4 transition hover:underline ${
                                        isDark ? 'text-emerald-300 hover:text-emerald-200' : 'text-emerald-800 hover:text-emerald-900'
                                    }`}
                                >
                                    <Briefcase className="h-4 w-4 shrink-0" aria-hidden />
                                    {t.quickCompany}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={route('register', { role: 'student' })}
                                    className={`inline-flex items-center gap-2 text-sm font-bold underline-offset-4 transition hover:underline ${
                                        isDark ? 'text-[#8ad9eb] hover:text-[#b7ebff]' : 'text-[#0B2447] hover:text-[#19A7CE]'
                                    }`}
                                >
                                    <Lightbulb className="h-4 w-4 shrink-0" aria-hidden />
                                    {t.quickStudent}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={route('research')}
                                    className={`inline-flex items-center gap-2 text-sm font-bold underline-offset-4 transition hover:underline ${
                                        isDark ? 'text-violet-300 hover:text-violet-200' : 'text-violet-800 hover:text-violet-950'
                                    }`}
                                >
                                    <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                                    {t.quickRd}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div
                    className={`mt-10 flex flex-col gap-2 border-t pt-6 text-xs md:flex-row md:items-center md:justify-between ${
                        isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'
                    }`}
                >
                    <p>
                        © {new Date().getFullYear()} {isArabic ? 'جسر الابتكار' : 'Innovation Bridge (InnoBridge)'}. {t.copy}
                    </p>
                </div>
            </div>
        </footer>
    );
}
