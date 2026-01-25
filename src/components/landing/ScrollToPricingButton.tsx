'use client';

export function ScrollToPricingButton() {
  const handleClick = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <button 
      onClick={handleClick}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer whitespace-nowrap bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-emerald-100 border-0 px-8 py-4 text-lg rounded-full font-bold"
    >
      אני רוצה להצטרף
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </button>
  );
}

