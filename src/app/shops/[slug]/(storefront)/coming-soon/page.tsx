import { getStoreBySlug, getPageSectionsCached, getPageSections } from '@/lib/db/queries';
import { StoreFooter } from '@/components/store-footer';
import { EditorSectionHighlighter } from '@/components/storefront/editor-section-highlighter';
import { headers, cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { PasswordForm } from './password-form';

// ============================================
// Coming Soon Page - Server Component
// Shows the coming_soon page sections (editable in editor)
// ============================================

interface ComingSoonPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ComingSoonPage({ params }: ComingSoonPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get basePath
  const headersList = await headers();
  const basePath = headersList.get('x-custom-domain') ? '' : `/shops/${slug}`;
  
  // Check if preview mode (from editor iframe)
  const isPreviewMode = headersList.get('x-preview-mode') === 'true';
  
  // Check if user has password cookie
  const cookieStore = await cookies();
  const hasPreviewAccess = cookieStore.get(`preview_${slug}`)?.value === 'true';
  
  // If user has preview access, redirect to main store
  if (hasPreviewAccess && !isPreviewMode) {
    redirect(`/shops/${slug}`);
  }
  
  // Fetch coming_soon sections - use non-cached version in preview mode for live updates
  const sections = isPreviewMode 
    ? await getPageSections(store.id, 'coming_soon')
    : await getPageSectionsCached(store.id, 'coming_soon');

  // Get store settings
  const storeSettings = (store.settings as Record<string, unknown>) || {};
  const comingSoonSettings = (storeSettings.comingSoon as Record<string, unknown>) || {};
  
  // Password protection settings
  const passwordEnabled = (storeSettings.comingSoonPasswordEnabled as boolean) || false;
  const passwordValue = (storeSettings.comingSoonPassword as string) || '';

  // Default values
  const title = (comingSoonSettings.title as string) || 'Coming Soon';
  const subtitle = (comingSoonSettings.subtitle as string) || store.name;
  const description = (comingSoonSettings.description as string) || 'אנחנו עובדים על משהו מיוחד.\nהשאירו את האימייל שלכם ונעדכן אתכם כשנפתח.';
  const showNewsletter = comingSoonSettings.showNewsletter !== false;
  const buttonText = (comingSoonSettings.buttonText as string) || 'עדכנו אותי';
  const placeholderText = (comingSoonSettings.placeholderText as string) || 'כתובת אימייל';
  const backgroundImage = comingSoonSettings.backgroundImage as string | undefined;
  const socialFacebook = storeSettings.socialFacebook as string | undefined;
  const socialInstagram = storeSettings.socialInstagram as string | undefined;

  // If there are custom sections, render them
  if (sections.length > 0) {
    // Import section components dynamically
    const { 
      HeroSection, 
      NewsletterSection 
    } = await import('@/components/sections');

    const renderSection = (section: typeof sections[0]) => {
      const content = section.content as Record<string, unknown>;
      const settings = section.settings as Record<string, unknown>;

      switch (section.type) {
        case 'hero':
          return (
            <HeroSection
              key={section.id}
              title={section.title}
              subtitle={section.subtitle}
              content={content as { imageUrl?: string; buttonText?: string; buttonLink?: string }}
              settings={settings as { height?: string; overlay?: number }}
              basePath={basePath}
              sectionId={section.id}
            />
          );
        case 'newsletter':
          return (
            <NewsletterSection
              key={section.id}
              title={section.title}
              subtitle={section.subtitle}
              content={content as { placeholder?: string; buttonText?: string }}
              settings={settings as { maxWidth?: string }}
              sectionId={section.id}
            />
          );
        default:
          return null;
      }
    };

    return (
      <div className="min-h-screen">
        {isPreviewMode && <EditorSectionHighlighter />}
        {sections.map((section) => renderSection(section))}
      </div>
    );
  }

  // Default Coming Soon template (when no sections exist)
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {isPreviewMode && <EditorSectionHighlighter />}
      
      {/* Coming Soon Hero */}
      <section 
        className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden"
        data-section-id="coming-soon-hero"
        style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1a1a1a_0%,#000_100%)]" style={{ opacity: backgroundImage ? 0.8 : 1 }} />
        
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <p className="text-white/40 text-[10px] tracking-[0.5em] uppercase mb-8 animate-fade-in">
            {subtitle}
          </p>
          
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-extralight tracking-[0.2em] mb-8 animate-slide-up uppercase">
            {title}
          </h1>
          
          <div className="w-16 h-px bg-white/20 mx-auto mb-8" />
          
          <p className="text-white/50 text-sm tracking-wide leading-relaxed mb-12 animate-slide-up whitespace-pre-line" style={{ animationDelay: '200ms' }}>
            {description}
          </p>

          {/* Password form OR Newsletter signup */}
          {passwordEnabled && passwordValue ? (
            <div className="mb-8">
              <p className="text-white/40 text-xs mb-4">יש לך סיסמה? הכנס אותה כדי לצפות באתר</p>
              <PasswordForm storeSlug={slug} correctPassword={passwordValue} />
            </div>
          ) : showNewsletter && (
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-3 animate-slide-up" style={{ animationDelay: '400ms' }}>
              <input 
                type="email" 
                placeholder={placeholderText}
                className="flex-1 px-6 py-4 bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-white/30 transition-colors"
              />
              <button className="px-8 py-4 bg-white text-black text-[11px] tracking-[0.15em] uppercase hover:bg-white/90 transition-colors cursor-pointer">
                {buttonText}
              </button>
            </div>
          )}
        </div>

        {/* Social links */}
        {(socialFacebook || socialInstagram) && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
            <div className="flex gap-6">
              {socialInstagram && (
                <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60 transition-colors text-xs tracking-wide">Instagram</a>
              )}
              {socialFacebook && (
                <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60 transition-colors text-xs tracking-wide">Facebook</a>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <p className="text-[10px] text-white/20 tracking-wide">
            © {new Date().getFullYear()} {store.name}
          </p>
          <p className="text-[10px] text-white/20 tracking-wide">
            נבנה עם QuickShop ⚡
          </p>
        </div>
      </footer>
    </div>
  );
}

