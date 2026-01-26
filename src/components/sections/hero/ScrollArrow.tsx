'use client';

interface ScrollArrowProps {
  sectionId?: string;
}

export function ScrollArrow({ sectionId }: ScrollArrowProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const currentSection = document.querySelector(`[data-section-id="${sectionId}"]`);
    const nextSection = currentSection?.nextElementSibling;
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <button
      type="button"
      data-scroll-arrow
      onClick={handleClick}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer 
                 hover:scale-110 transition-transform p-2 focus:outline-none"
      aria-label="גלול למטה"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
        <path d="M12 5v14M19 12l-7 7-7-7"/>
      </svg>
    </button>
  );
}

