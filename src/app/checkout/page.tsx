import { CheckoutForm } from '@/components/checkout-form';
import { Suspense } from 'react';

// Force dynamic rendering - useSearchParams needs it
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'צ\'ק אאוט | TechStyle',
  description: 'השלמת הרכישה',
};

function CheckoutSkeleton() {
  return (
    <div className="py-32 px-6 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-8 flex justify-center">
          <div className="w-px h-16 bg-black animate-pulse" />
        </div>
        <p className="text-[11px] tracking-[0.3em] uppercase text-black">
          טוען
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-3xl md:text-4xl font-light tracking-[0.1em]">
            צ׳ק אאוט
          </h1>
        </div>
      </div>

      {/* Form - Client Component for interactivity */}
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutForm />
      </Suspense>
    </div>
  );
}

