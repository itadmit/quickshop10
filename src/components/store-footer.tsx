import Link from 'next/link';
import { NewsletterForm } from './storefront/newsletter-form';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FooterMenuItem {
  id: string;
  title: string;
  linkType: 'page' | 'category' | 'product' | 'custom' | 'collection';
  linkUrl?: string | null;
  linkResourceId?: string | null;
  pageSlug?: string | null; // For page links
}

interface ThemeSettings {
  footerShowLogo?: boolean;
  footerShowNewsletter?: boolean;
  footerNewsletterTitle?: string;
  footerNewsletterSubtitle?: string;
  footerShowSocial?: boolean;
  footerShowPayments?: boolean;
  footerCopyright?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  socialTiktok?: string;
  socialYoutube?: string;
}

interface StoreFooterProps {
  storeName: string;
  storeSlug: string;
  categories?: Category[];
  basePath: string;
  settings?: ThemeSettings;
  footerMenuItems?: FooterMenuItem[];
}

export function StoreFooter({ 
  storeName, 
  storeSlug,
  categories = [], 
  basePath,
  settings = {},
  footerMenuItems = [],
}: StoreFooterProps) {
  // Default settings
  const {
    footerShowLogo = true,
    footerShowNewsletter = true,
    footerNewsletterTitle = 'הירשמו לניוזלטר',
    footerNewsletterSubtitle = 'קבלו עדכונים על מוצרים חדשים והנחות בלעדיות',
    footerShowSocial = true,
    footerShowPayments = true,
    footerCopyright,
    footerBgColor = '#ffffff',
    footerTextColor = '#111111',
    socialFacebook,
    socialInstagram,
    socialTiktok,
    socialYoutube,
  } = settings;

  // Check if any social links exist
  const hasSocialLinks = socialFacebook || socialInstagram || socialTiktok || socialYoutube;

  return (
    <footer 
      className="py-16 px-6 border-t border-gray-100"
      style={{ 
        backgroundColor: footerBgColor,
        color: footerTextColor,
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Column 1: Logo & Description */}
          {footerShowLogo && (
            <div>
              <h3 className="font-display text-2xl tracking-[0.2em] mb-4 uppercase">{storeName}</h3>
              <p className="text-sm opacity-60 leading-relaxed">
                אופנה מינימליסטית ואיכותית. עיצובים נצחיים שמתאימים לכל סגנון חיים.
              </p>
            </div>
          )}
          
          {/* Column 2: Categories */}
          <div>
            <h4 className="text-[11px] tracking-[0.2em] uppercase mb-5 opacity-80">קטגוריות</h4>
            <ul className="space-y-2.5">
              {categories.slice(0, 6).map(cat => (
                <li key={cat.id}>
                  <Link 
                    href={`${basePath === '' ? '/' : basePath}/category/${cat.slug}`} 
                    className="text-sm opacity-60 hover:opacity-100 transition-opacity"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Column 3: Information (from footer menu) */}
          <div>
            <h4 className="text-[11px] tracking-[0.2em] uppercase mb-5 opacity-80">מידע</h4>
            <ul className="space-y-2.5 text-sm opacity-60">
              {footerMenuItems.length > 0 ? (
                footerMenuItems.slice(0, 6).map(item => {
                  // Determine the href based on link type
                  let href = '#';
                  if (item.linkType === 'page' && item.pageSlug) {
                    href = `${basePath}/pages/${item.pageSlug}`;
                  } else if (item.linkType === 'custom' && item.linkUrl) {
                    href = item.linkUrl;
                  } else if (item.linkType === 'category' && item.linkResourceId) {
                    href = `${basePath}/category/${item.linkResourceId}`;
                  } else if (item.linkType === 'product' && item.linkResourceId) {
                    href = `${basePath}/products/${item.linkResourceId}`;
                  }
                  
                  return (
                    <li key={item.id}>
                      <Link 
                        href={href}
                        className="hover:opacity-100 transition-opacity"
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })
              ) : (
                // Fallback for stores without footer menu
                <>
                  <li><Link href={`${basePath}/pages/about`} className="hover:opacity-100 transition-opacity">אודות</Link></li>
                  <li><Link href={`${basePath}/pages/contact`} className="hover:opacity-100 transition-opacity">צור קשר</Link></li>
                  <li><Link href={`${basePath}/pages/shipping`} className="hover:opacity-100 transition-opacity">משלוחים</Link></li>
                  <li><Link href={`${basePath}/pages/privacy`} className="hover:opacity-100 transition-opacity">מדיניות פרטיות</Link></li>
                </>
              )}
            </ul>
          </div>
          
          {/* Column 4: Newsletter OR Social Links */}
          {footerShowNewsletter ? (
            <div>
              <h4 className="text-[11px] tracking-[0.2em] uppercase mb-5 opacity-80">{footerNewsletterTitle}</h4>
              <p className="text-sm opacity-60 mb-4">{footerNewsletterSubtitle}</p>
              <NewsletterForm storeSlug={storeSlug} />
              
              {/* Social Links under newsletter */}
          {footerShowSocial && hasSocialLinks && (
                <div className="flex gap-4 mt-6">
                  {socialInstagram && (
                    <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                      <InstagramIcon />
                    </a>
                  )}
                  {socialFacebook && (
                    <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                      <FacebookIcon />
                    </a>
                  )}
                  {socialTiktok && (
                    <a href={socialTiktok} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                      <TiktokIcon />
                    </a>
                  )}
                  {socialYoutube && (
                    <a href={socialYoutube} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                      <YoutubeIcon />
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : footerShowSocial && hasSocialLinks ? (
            <div>
              <h4 className="text-[11px] tracking-[0.2em] uppercase mb-5 opacity-80">עקבו אחרינו</h4>
              <div className="flex gap-4">
                {socialInstagram && (
                  <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                    <InstagramIcon />
                  </a>
                )}
                {socialFacebook && (
                  <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                    <FacebookIcon />
                  </a>
                )}
                {socialTiktok && (
                  <a href={socialTiktok} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                    <TiktokIcon />
                  </a>
                )}
                {socialYoutube && (
                  <a href={socialYoutube} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                    <YoutubeIcon />
                  </a>
                )}
              </div>
            </div>
          ) : null}
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-current/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs opacity-40 tracking-wide">
            {footerCopyright || `© ${new Date().getFullYear()} ${storeName}. כל הזכויות שמורות.`}
          </p>
          
          {/* Payment Icons */}
          {footerShowPayments && (
            <div className="flex items-center gap-3 opacity-40">
              <VisaIcon />
              <MastercardIcon />
              <AmexIcon />
            </div>
          )}
          
          <p className="text-xs opacity-30 tracking-wide">
            נבנה עם QuickShop ⚡
          </p>
        </div>
      </div>
    </footer>
  );
}

// Social Icons
function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

// Payment Icons
function VisaIcon() {
  return (
    <svg width="32" height="20" viewBox="0 0 32 20" fill="currentColor">
      <rect width="32" height="20" rx="2" fill="currentColor" fillOpacity="0.1"/>
      <path d="M13.3 13.5H11.5L12.6 6.5H14.4L13.3 13.5ZM10.3 6.5L8.6 11.4L8.4 10.4L7.7 7.2C7.7 7.2 7.6 6.5 6.7 6.5H3.8L3.8 6.7C3.8 6.7 4.8 6.9 6 7.6L7.7 13.5H9.6L12.2 6.5H10.3ZM24.2 13.5H25.9L24.4 6.5H22.9C22.2 6.5 22 7 22 7L19.2 13.5H21.1L21.5 12.4H23.8L24.2 13.5ZM22 11L23 8.2L23.6 11H22ZM19.3 8.4L19.6 6.7C19.6 6.7 18.7 6.4 17.7 6.4C16.6 6.4 14.1 6.9 14.1 9.1C14.1 11.2 17 11.2 17 12.2C17 13.2 14.4 12.9 13.4 12.1L13.1 13.9C13.1 13.9 14 14.3 15.4 14.3C16.8 14.3 19.3 13.5 19.3 11.4C19.3 9.2 16.4 9.1 16.4 8.2C16.4 7.3 18.4 7.5 19.3 8.4Z" fill="currentColor"/>
    </svg>
  );
}

function MastercardIcon() {
  return (
    <svg width="32" height="20" viewBox="0 0 32 20" fill="currentColor">
      <rect width="32" height="20" rx="2" fill="currentColor" fillOpacity="0.1"/>
      <circle cx="12" cy="10" r="5" fill="currentColor" fillOpacity="0.6"/>
      <circle cx="20" cy="10" r="5" fill="currentColor" fillOpacity="0.4"/>
    </svg>
  );
}

function AmexIcon() {
  return (
    <svg width="32" height="20" viewBox="0 0 32 20" fill="currentColor">
      <rect width="32" height="20" rx="2" fill="currentColor" fillOpacity="0.1"/>
      <path d="M7 13L9 7H11L13 13H11.3L11 12H9L8.7 13H7ZM9.3 11H10.7L10 8.5L9.3 11ZM13.5 13V7H16L17 11L18 7H20.5V13H19V8.5L17.8 13H16.2L15 8.5V13H13.5ZM21.5 13V7H25V8H23V9.5H25V10.5H23V12H25V13H21.5Z" fill="currentColor"/>
    </svg>
  );
}
