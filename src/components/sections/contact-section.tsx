/**
 * ContactSection - Server Component with Client Form
 * סקשן יצירת קשר - הטופס עצמו הוא client component לצורך חיווי
 * 
 * 🔧 Uses shared section-system constants
 * ✅ Supports real-time editing with data attributes
 */

import { ContactForm } from './contact-form';
import { TITLE_SIZES, FONT_WEIGHTS, MAX_WIDTHS } from '@/lib/section-system';
import type { TitleSize, FontWeight } from '@/lib/section-system';

interface ContactSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    // Contact info
    email?: string;
    phone?: string;
    address?: string;
    hours?: string;
    // Form settings
    showForm?: boolean;
    formAction?: string;
    submitButtonText?: string;
    formTag?: string; // תגית שתישמר עם הפנייה
    // Social links
    socialLinks?: Array<{
      type: 'facebook' | 'instagram' | 'twitter' | 'whatsapp' | 'telegram';
      url: string;
    }>;
    // Custom text
    text?: string;
  };
  settings: {
    layout?: 'simple' | 'split' | 'form-only' | 'info-only';
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    textAlign?: 'right' | 'center' | 'left';
    backgroundColor?: string;
    textColor?: string;
    paddingY?: 'small' | 'medium' | 'large';
    paddingTop?: number;
    paddingBottom?: number;
    // Typography - Title
    titleColor?: string;
    titleSize?: TitleSize | number;
    titleSizeMobile?: number;
    titleWeight?: FontWeight;
    // Typography - Subtitle
    subtitleSize?: number;
    subtitleSizeMobile?: number;
    subtitleColor?: string;
    // Typography - Labels
    labelSize?: number;
    labelSizeMobile?: number;
    labelColor?: string;
    labelWeight?: string;
    // Typography - Info values
    infoSize?: number;
    infoSizeMobile?: number;
    infoColor?: string;
    infoWeight?: string;
    // Input fields
    inputSize?: number;
    inputSizeMobile?: number;
    inputColor?: string;
    inputBackgroundColor?: string;
    inputBorderColor?: string;
    inputBorderRadius?: number;
    // Button
    buttonTextColor?: string;
    buttonBackgroundColor?: string;
    buttonSize?: number;
    buttonSizeMobile?: number;
    buttonWeight?: string;
    buttonBorderRadius?: number;
    buttonPadding?: number;
    // Layout
    sectionWidth?: 'full' | 'boxed';
    contentWidth?: number;
    minHeight?: number;
    minHeightUnit?: 'px' | 'vh';
    verticalAlign?: 'start' | 'center' | 'end';
    // Custom
    customClass?: string;
    customId?: string;
    // Visibility
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
    // Z-index
    zIndex?: number;
  };
  basePath?: string;
  sectionId?: string;
  storeSlug?: string;
}

export function ContactSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  basePath = '',
  sectionId,
  storeSlug
}: ContactSectionProps) {
  const layout = settings.layout || 'simple';
  const maxWidth = settings.maxWidth || 'lg';
  const textAlign = settings.textAlign || 'center';
  
  // Check if numeric font sizes
  const titleSizeValue = settings.titleSize;
  const isNumericTitleSize = typeof titleSizeValue === 'number';
  const titleSize = isNumericTitleSize ? 'lg' : (titleSizeValue || 'lg');
  const titleWeight = settings.titleWeight || 'bold';
  
  const subtitleSizeValue = settings.subtitleSize;
  const isNumericSubtitleSize = typeof subtitleSizeValue === 'number';

  const maxWidthClass = MAX_WIDTHS[maxWidth] || MAX_WIDTHS.lg;

  // Padding - use numeric values if provided, otherwise use paddingY classes
  const paddingTop = settings.paddingTop ?? 64;
  const paddingBottom = settings.paddingBottom ?? 64;

  const showInfo = layout !== 'form-only';
  // Default showForm to true unless explicitly set to false
  const showForm = (content.showForm !== false) && layout !== 'info-only';

  const hasCustomSizes = isNumericTitleSize || isNumericSubtitleSize;
  
  // Visibility classes
  const hideOnMobileClass = settings.hideOnMobile ? 'max-md:hidden' : '';
  const hideOnDesktopClass = settings.hideOnDesktop ? 'md:hidden' : '';

  // Section width
  const sectionWidth = settings.sectionWidth || 'full';
  const contentWidth = settings.contentWidth || 1200;

  // Min height
  const minHeight = settings.minHeight || 0;
  const minHeightUnit = settings.minHeightUnit || 'px';

  // Vertical align
  const verticalAlign = settings.verticalAlign || 'start';
  const verticalAlignClass = {
    'start': 'justify-start',
    'center': 'justify-center',
    'end': 'justify-end',
  }[verticalAlign];

  // Default content values for display
  const displayTitle = title || 'צור קשר';
  const displaySubtitle = subtitle || '';
  const displayEmail = content.email || 'info@example.com';
  const displayPhone = content.phone || '03-1234567';
  const displayAddress = content.address || '';
  const displayHours = content.hours || '';

  return (
    <section 
      className={`px-4 ${hideOnMobileClass} ${hideOnDesktopClass} ${settings.customClass || ''} ${minHeight > 0 ? `flex flex-col ${verticalAlignClass}` : ''}`.trim()}
      style={{ 
        backgroundColor: settings.backgroundColor || '#f9fafb',
        color: settings.textColor || 'inherit',
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        minHeight: minHeight > 0 ? `${minHeight}${minHeightUnit}` : undefined,
        zIndex: settings.zIndex,
      }}
      id={settings.customId || 'contact'}
      data-section-id={sectionId}
      data-section-type="contact"
      data-section-name="יצירת קשר"
      data-min-height={minHeight}
      data-min-height-unit={minHeightUnit}
      data-vertical-align={verticalAlign}
      {...(settings.hideOnMobile && { 'data-hide-on-mobile': 'true' })}
      {...(settings.hideOnDesktop && { 'data-hide-on-desktop': 'true' })}
    >
      {/* Scoped responsive styles for numeric font sizes */}
      {hasCustomSizes && (
        <style dangerouslySetInnerHTML={{ __html: `
          ${isNumericTitleSize ? `
            [data-section-id="${sectionId}"] [data-section-title] {
              font-size: ${settings.titleSizeMobile || (titleSizeValue as number) * 0.7}px !important;
            }
            @media (min-width: 768px) {
              [data-section-id="${sectionId}"] [data-section-title] {
                font-size: ${titleSizeValue}px !important;
              }
            }
          ` : ''}
          ${isNumericSubtitleSize ? `
            [data-section-id="${sectionId}"] [data-section-subtitle] {
              font-size: ${settings.subtitleSizeMobile || (subtitleSizeValue as number) * 0.8}px !important;
            }
            @media (min-width: 768px) {
              [data-section-id="${sectionId}"] [data-section-subtitle] {
                font-size: ${subtitleSizeValue}px !important;
              }
            }
          ` : ''}
        `}} />
      )}
      
      {/* Content Wrapper - for section width control */}
      <div 
        className={`${sectionWidth === 'boxed' ? 'mx-auto' : ''} w-full`}
        style={sectionWidth === 'boxed' ? { maxWidth: `${contentWidth}px`, width: `${contentWidth}px` } : undefined}
        data-content-wrapper
      >
        <div className={`${maxWidthClass} mx-auto`}>
          {/* Title - always render for real-time editing */}
          <h2 
            className={`${!isNumericTitleSize ? TITLE_SIZES[titleSize as TitleSize] : ''} ${FONT_WEIGHTS[titleWeight]} text-${textAlign} tracking-wide mb-4`}
            data-section-title
            style={{ 
              color: settings.titleColor || 'inherit',
              display: displayTitle ? 'block' : 'none',
            }}
          >
            {displayTitle}
          </h2>

          {/* Subtitle - always render for real-time editing */}
          <p 
            className={`${!isNumericSubtitleSize ? 'text-lg' : ''} opacity-80 mb-8 text-${textAlign}`}
            data-section-subtitle
            style={{ 
              color: settings.subtitleColor || 'inherit',
              display: displaySubtitle ? 'block' : 'none',
            }}
          >
            {displaySubtitle}
          </p>

          {/* Content area - split or simple layout */}
          <div className={layout === 'split' ? 'grid md:grid-cols-2 gap-12' : ''} data-contact-content>
            
            {/* Contact Info - Zara-style minimalist design */}
            {showInfo && (
              <div className={`space-y-8 ${layout === 'split' ? '' : 'mb-12'} text-${textAlign}`} data-contact-info>
                
                {/* Custom text */}
                {content.text && (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: content.text }}
                    data-contact-text
                  />
                )}
                
                {/* Contact details - clean list style */}
                <div className="space-y-6" data-contact-details>
                  {/* Email */}
                  <div style={{ display: displayEmail ? 'block' : 'none' }} data-contact-email-wrapper>
                    <p 
                      className="uppercase tracking-widest mb-1" 
                      data-contact-label
                      style={{
                        fontSize: `${settings.labelSize || 12}px`,
                        color: (settings.labelColor as string) || '#6b7280',
                        fontWeight: (settings.labelWeight as string) || 'normal',
                      }}
                    >
                      אימייל
                    </p>
                    <a 
                      href={`mailto:${displayEmail}`} 
                      className="hover:underline" 
                      dir="ltr" 
                      data-contact-email
                      data-contact-value
                      style={{
                        fontSize: `${settings.infoSize || 14}px`,
                        color: (settings.infoColor as string) || '#111827',
                        fontWeight: (settings.infoWeight as string) || 'normal',
                      }}
                    >
                      {displayEmail}
                    </a>
                  </div>
                  
                  {/* Phone */}
                  <div style={{ display: displayPhone ? 'block' : 'none' }} data-contact-phone-wrapper>
                    <p 
                      className="uppercase tracking-widest mb-1" 
                      data-contact-label
                      style={{
                        fontSize: `${settings.labelSize || 12}px`,
                        color: (settings.labelColor as string) || '#6b7280',
                        fontWeight: (settings.labelWeight as string) || 'normal',
                      }}
                    >
                      טלפון
                    </p>
                    <a 
                      href={`tel:${displayPhone}`} 
                      className="hover:underline" 
                      dir="ltr" 
                      data-contact-phone
                      data-contact-value
                      style={{
                        fontSize: `${settings.infoSize || 14}px`,
                        color: (settings.infoColor as string) || '#111827',
                        fontWeight: (settings.infoWeight as string) || 'normal',
                      }}
                    >
                      {displayPhone}
                    </a>
                  </div>
                  
                  {/* Address */}
                  <div style={{ display: displayAddress ? 'block' : 'none' }} data-contact-address-wrapper>
                    <p 
                      className="uppercase tracking-widest mb-1" 
                      data-contact-label
                      style={{
                        fontSize: `${settings.labelSize || 12}px`,
                        color: (settings.labelColor as string) || '#6b7280',
                        fontWeight: (settings.labelWeight as string) || 'normal',
                      }}
                    >
                      כתובת
                    </p>
                    <span 
                      data-contact-address
                      data-contact-value
                      style={{
                        fontSize: `${settings.infoSize || 14}px`,
                        color: (settings.infoColor as string) || '#111827',
                        fontWeight: (settings.infoWeight as string) || 'normal',
                      }}
                    >
                      {displayAddress}
                    </span>
                  </div>
                  
                  {/* Hours */}
                  <div style={{ display: displayHours ? 'block' : 'none' }} data-contact-hours-wrapper>
                    <p 
                      className="uppercase tracking-widest mb-1" 
                      data-contact-label
                      style={{
                        fontSize: `${settings.labelSize || 12}px`,
                        color: (settings.labelColor as string) || '#6b7280',
                        fontWeight: (settings.labelWeight as string) || 'normal',
                      }}
                    >
                      שעות פעילות
                    </p>
                    <span 
                      data-contact-hours
                      data-contact-value
                      style={{
                        fontSize: `${settings.infoSize || 14}px`,
                        color: (settings.infoColor as string) || '#111827',
                        fontWeight: (settings.infoWeight as string) || 'normal',
                      }}
                    >
                      {displayHours}
                    </span>
                  </div>
                </div>

                {/* Social Links - Minimal style */}
                {content.socialLinks && content.socialLinks.length > 0 && (
                  <div className="flex items-center gap-6 mt-8" data-social-links>
                    {content.socialLinks.map((link, idx) => (
                      <a 
                        key={idx} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-black transition-colors"
                        aria-label={link.type}
                      >
                        {link.type === 'facebook' && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        )}
                        {link.type === 'instagram' && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        )}
                        {link.type === 'whatsapp' && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        )}
                        {link.type === 'telegram' && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                          </svg>
                        )}
                        {link.type === 'twitter' && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Contact Form - Client Component with feedback */}
            {showForm && storeSlug && (
              <ContactForm
                storeSlug={storeSlug}
                sectionId={sectionId}
                submitButtonText={content.submitButtonText || 'שליחה'}
                formTag={content.formTag}
                // Button styling
                buttonBackgroundColor={(settings.buttonBackgroundColor as string) || '#000'}
                buttonTextColor={(settings.buttonTextColor as string) || '#fff'}
                buttonBorderRadius={(settings.buttonBorderRadius as number) || 4}
                buttonPadding={(settings.buttonPadding as number) || 12}
                buttonSize={(settings.buttonSize as number) || 14}
                buttonWeight={(settings.buttonWeight as string) || 'medium'}
                // Input styling
                inputBackgroundColor={(settings.inputBackgroundColor as string) || '#ffffff'}
                inputBorderColor={(settings.inputBorderColor as string) || '#d1d5db'}
                inputBorderRadius={(settings.inputBorderRadius as number) || 4}
                inputSize={(settings.inputSize as number) || 14}
                inputColor={(settings.inputColor as string) || '#111827'}
                // Label styling
                labelSize={(settings.labelSize as number) || 12}
                labelColor={(settings.labelColor as string) || '#6b7280'}
                labelWeight={(settings.labelWeight as string) || 'normal'}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
