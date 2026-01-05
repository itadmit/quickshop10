interface NewsletterSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    placeholder?: string;
    buttonText?: string;
  };
  settings: {
    maxWidth?: string;
  };
}

export function NewsletterSection({ title, subtitle, content, sectionId }: NewsletterSectionProps & { sectionId?: string }) {
  return (
    <section 
      className="py-24 px-6 bg-gray-50"
      data-section-id={sectionId}
      data-section-name="הצטרפו למועדון"
    >
      <div className="max-w-xl mx-auto text-center">
        {title && (
          <h2 
            className="font-display text-2xl md:text-3xl font-light tracking-[0.15em] uppercase mb-4"
            data-section-title
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p 
            className="text-gray-500 text-sm mb-10"
            data-section-subtitle
          >
            {subtitle}
          </p>
        )}
        <div className="flex max-w-md mx-auto">
          <input 
            type="email" 
            placeholder={content.placeholder || 'כתובת אימייל'}
            className="flex-1 px-6 py-4 border border-gray-200 text-sm focus:border-black transition-colors bg-white"
          />
          <button className="px-8 py-4 bg-black text-white text-[11px] tracking-[0.15em] uppercase hover:bg-gray-900 transition-colors cursor-pointer">
            {content.buttonText || 'הרשמה'}
          </button>
        </div>
      </div>
    </section>
  );
}


