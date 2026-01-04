import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { CustomerDetailsForm } from '@/components/customer-details-form';

export const metadata = {
  title: 'פרטים אישיים',
  description: 'עריכת פרטים אישיים',
};

interface DetailsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CustomerDetailsPage({ params }: DetailsPageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }
  
  const basePath = `/shops/${slug}`;
  
  // Check if logged in
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect(`${basePath}/login?callbackUrl=${encodeURIComponent(`${basePath}/account/details`)}`);
  }

  // Pass customer data to client form (only what's needed)
  const customerData = {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    acceptsMarketing: customer.acceptsMarketing,
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href={`${basePath}/account`}
            className="text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            חזרה לאיזור האישי
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-wide mb-2">
            פרטים אישיים
          </h1>
          <p className="text-gray-500 text-sm">
            עדכון הפרטים האישיים שלך
          </p>
        </div>

        {/* Form - Client Component */}
        <CustomerDetailsForm 
          customer={customerData}
          basePath={basePath}
        />
      </div>
    </div>
  );
}


