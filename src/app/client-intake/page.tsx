import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ClientIntakeWizard } from "@/components/landing/ClientIntakeWizard";
import type { Metadata } from 'next';

// ISR for good performance
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "שאלון אפיון אתר | קוויק שופ",
  description: "ענו על כמה שאלות קצרות ונבנה לכם את האתר המושלם - מהר ובדיוק לפי הסגנון שלכם",
};

export default function ClientIntakePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans text-white" dir="rtl">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-8 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            שאלון אפיון מהיר
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            בואו נבנה לכם את האתר <span className="text-emerald-400">המושלם</span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            ענו על כמה שאלות קצרות ונדע בדיוק מה אתם צריכים.
            <br />
            בסוף נקבל תבנית מוכנה שתואמת את הסגנון שלכם!
          </p>
        </div>
      </section>

      {/* Wizard Section */}
      <section className="relative pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ClientIntakeWizard />
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

