import { NextResponse, type NextRequest } from 'next/server';
import { getTemplateById } from '@/lib/templates';

// GET /api/shops/[slug]/templates/preview?templateId=xxx
// Returns HTML preview of a template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('templateId');

  if (!templateId) {
    return new NextResponse('Missing templateId', { status: 400 });
  }

  const template = getTemplateById(templateId);
  if (!template) {
    return new NextResponse('Template not found', { status: 404 });
  }

  // Generate CSS variables
  const cssVars = Object.entries(template.cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n      ');

  // Generate sections HTML
  const sectionsHtml = template.sections.map(section => {
    return renderSectionPreview(section);
  }).join('\n');

  // Full HTML document
  const html = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>תצוגה מקדימה: ${template.name}</title>
  <!-- Hebrew fonts first for better RTL support -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700&family=Heebo:wght@400;500;600;700&family=Noto+Sans+Hebrew:wght@400;500;600;700&family=Rubik:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      ${cssVars}
    }
    body {
      font-family: var(--template-font-body);
      background-color: var(--template-bg);
      color: var(--template-text);
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--template-font-heading);
    }
    .btn-primary {
      background-color: var(--template-primary);
      color: var(--template-secondary);
      border-radius: var(--template-radius);
    }
    .btn-outline {
      border: 2px solid var(--template-primary);
      color: var(--template-primary);
      border-radius: var(--template-radius);
    }
    .bg-alt {
      background-color: var(--template-bg-alt);
    }
    .text-muted {
      color: var(--template-text-muted);
    }
  </style>
</head>
<body>
  <!-- Announcement Bar -->
  <div style="background-color: ${template.themeSettings.announcementBg}; color: ${template.themeSettings.announcementColor};" class="py-2 text-center text-sm">
    ${template.themeSettings.announcementText || ''}
  </div>
  
  <!-- Header -->
  <header style="background-color: var(--template-bg);" class="sticky top-0 z-50 border-b border-gray-100">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="text-xl font-bold" style="font-family: var(--template-font-heading);">
        DEMO STORE
      </div>
      <nav class="hidden md:flex gap-6 text-sm">
        <a href="#" class="hover:opacity-70">דף הבית</a>
        <a href="#" class="hover:opacity-70">מוצרים</a>
        <a href="#" class="hover:opacity-70">קטגוריות</a>
        <a href="#" class="hover:opacity-70">אודות</a>
      </nav>
      <div class="flex items-center gap-4">
        <button class="p-2 hover:opacity-70">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </button>
        <button class="p-2 hover:opacity-70">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </button>
      </div>
    </div>
  </header>

  <main>
    ${sectionsHtml}
  </main>

  <!-- Footer -->
  <footer style="background-color: var(--template-bg-alt);" class="py-12 mt-12">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid md:grid-cols-4 gap-8">
        <div>
          <div class="text-xl font-bold mb-4" style="font-family: var(--template-font-heading);">DEMO STORE</div>
          <p class="text-muted text-sm">תבנית ${template.name}</p>
        </div>
        <div>
          <h4 class="font-semibold mb-3">קישורים</h4>
          <ul class="space-y-2 text-sm text-muted">
            <li><a href="#">אודות</a></li>
            <li><a href="#">צור קשר</a></li>
            <li><a href="#">מדיניות משלוחים</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-3">קטגוריות</h4>
          <ul class="space-y-2 text-sm text-muted">
            <li><a href="#">כל המוצרים</a></li>
            <li><a href="#">מבצעים</a></li>
            <li><a href="#">חדש</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-3">הרשמו לניוזלטר</h4>
          <div class="flex gap-2">
            <input type="email" placeholder="אימייל" class="flex-1 px-3 py-2 border rounded-lg text-sm">
            <button class="btn-primary px-4 py-2 text-sm">שליחה</button>
          </div>
        </div>
      </div>
      <div class="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-muted">
        © 2025 Demo Store. כל הזכויות שמורות.
      </div>
    </div>
  </footer>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

// Render individual section preview
function renderSectionPreview(section: { type: string; title: string | null; subtitle: string | null; content: Record<string, unknown>; settings: Record<string, unknown> }): string {
  switch (section.type) {
    case 'hero':
      return `
        <section class="relative h-[70vh] flex items-center justify-center text-center" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${section.content.imageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920'}') center/cover;">
          <div class="text-white max-w-2xl px-6">
            <h1 class="text-4xl md:text-6xl font-bold mb-4">${section.title || 'כותרת ראשית'}</h1>
            <p class="text-lg mb-6 opacity-90">${section.subtitle || 'תיאור קצר'}</p>
            <a href="#" class="inline-block px-8 py-3 bg-white text-black font-medium hover:bg-gray-100 transition-colors" style="border-radius: var(--template-radius);">
              ${(section.content.buttonText as string) || 'לחנות'}
            </a>
          </div>
        </section>
      `;

    case 'features':
      const features = (section.content.features as Array<{ icon: string; title: string; description: string }>) || [];
      return `
        <section class="py-12 bg-alt">
          <div class="max-w-7xl mx-auto px-6">
            ${section.title ? `<h2 class="text-2xl font-bold text-center mb-8">${section.title}</h2>` : ''}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              ${features.map(f => `
                <div class="text-center">
                  <div class="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style="background-color: var(--template-bg-alt); color: var(--template-primary);">
                    ${getIconSvg(f.icon)}
                  </div>
                  <h3 class="font-semibold mb-1">${f.title}</h3>
                  <p class="text-sm text-muted">${f.description}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;

    case 'categories':
      return `
        <section class="py-12">
          <div class="max-w-7xl mx-auto px-6">
            ${section.title ? `<h2 class="text-2xl font-bold text-center mb-8">${section.title}</h2>` : ''}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              ${[1, 2, 3, 4].map(i => `
                <a href="#" class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                  <div class="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <span class="text-white font-semibold">קטגוריה ${i}</span>
                  </div>
                </a>
              `).join('')}
            </div>
          </div>
        </section>
      `;

    case 'products':
      return `
        <section class="py-12">
          <div class="max-w-7xl mx-auto px-6">
            ${section.title ? `
              <div class="text-center mb-8">
                <h2 class="text-2xl font-bold">${section.title}</h2>
                ${section.subtitle ? `<p class="text-muted mt-2">${section.subtitle}</p>` : ''}
              </div>
            ` : ''}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              ${[1, 2, 3, 4].map(i => `
                <div class="group">
                  <div class="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <div class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 group-hover:scale-105 transition-transform"></div>
                  </div>
                  <h3 class="font-medium mb-1">מוצר לדוגמה ${i}</h3>
                  <p class="text-muted">₪${99 + i * 50}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;

    case 'image_text':
      return `
        <section class="py-12">
          <div class="max-w-7xl mx-auto px-6">
            <div class="grid md:grid-cols-2 gap-8 items-center">
              <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                ${section.content.imageUrl ? `<img src="${section.content.imageUrl}" class="w-full h-full object-cover" alt="">` : '<div class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>'}
              </div>
              <div>
                ${section.title ? `<h2 class="text-2xl font-bold mb-4">${section.title}</h2>` : ''}
                ${section.subtitle ? `<p class="text-muted mb-4">${section.subtitle}</p>` : ''}
                <div class="text-muted mb-6">${section.content.text || 'טקסט לדוגמה עם תיאור של הקטע'}</div>
                ${section.content.buttonText ? `<a href="#" class="btn-primary px-6 py-3 inline-block">${section.content.buttonText}</a>` : ''}
              </div>
            </div>
          </div>
        </section>
      `;

    case 'reviews':
      const reviews = (section.content.reviews as Array<{ author: string; rating: number; text: string }>) || [];
      return `
        <section class="py-12 bg-alt">
          <div class="max-w-7xl mx-auto px-6">
            ${section.title ? `<h2 class="text-2xl font-bold text-center mb-8">${section.title}</h2>` : ''}
            <div class="grid md:grid-cols-3 gap-6">
              ${reviews.map(r => `
                <div class="bg-white p-6 rounded-xl shadow-sm">
                  <div class="flex gap-1 mb-3">
                    ${Array(5).fill(0).map((_, i) => `<span class="${i < r.rating ? 'text-yellow-400' : 'text-gray-300'}">★</span>`).join('')}
                  </div>
                  <p class="text-muted mb-4">"${r.text}"</p>
                  <p class="font-medium">${r.author}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;

    case 'newsletter':
      return `
        <section class="py-16" style="background-color: var(--template-bg-alt);">
          <div class="max-w-xl mx-auto px-6 text-center">
            ${section.title ? `<h2 class="text-2xl font-bold mb-2">${section.title}</h2>` : ''}
            ${section.subtitle ? `<p class="text-muted mb-6">${section.subtitle}</p>` : ''}
            <div class="flex gap-2">
              <input type="email" placeholder="${(section.content.placeholder as string) || 'כתובת אימייל'}" class="flex-1 px-4 py-3 border rounded-lg">
              <button class="btn-primary px-6 py-3">${(section.content.buttonText as string) || 'הרשמה'}</button>
            </div>
          </div>
        </section>
      `;

    case 'split_banner':
      return `
        <section class="grid md:grid-cols-2">
          <a href="#" class="relative h-[50vh] flex items-center justify-center text-white" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800') center/cover;">
            <span class="text-2xl font-bold">${(section.content as Record<string, Record<string, string>>).right?.title || 'קטגוריה א'}</span>
          </a>
          <a href="#" class="relative h-[50vh] flex items-center justify-center text-white" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800') center/cover;">
            <span class="text-2xl font-bold">${(section.content as Record<string, Record<string, string>>).left?.title || 'קטגוריה ב'}</span>
          </a>
        </section>
      `;

    case 'text_block':
      return `
        <section class="py-16">
          <div class="max-w-3xl mx-auto px-6 text-center">
            ${section.title ? `<h2 class="text-2xl font-bold mb-4">${section.title}</h2>` : ''}
            <div class="text-muted leading-relaxed">${section.content.text || 'טקסט לדוגמה'}</div>
          </div>
        </section>
      `;

    case 'banner_small':
      return `
        <section class="py-8" style="background-color: var(--template-primary);">
          <div class="max-w-7xl mx-auto px-6 text-center" style="color: var(--template-secondary);">
            ${section.content.icon ? `<div class="mb-3 flex justify-center">${getIconSvg(section.content.icon as string, 32)}</div>` : ''}
            ${section.title ? `<h3 class="text-xl font-bold mb-1">${section.title}</h3>` : ''}
            ${section.subtitle ? `<p class="opacity-80 mb-4">${section.subtitle}</p>` : ''}
            ${section.content.buttonText ? `<a href="#" class="inline-block px-6 py-2 bg-white rounded-lg font-medium" style="color: var(--template-primary);">${section.content.buttonText}</a>` : ''}
          </div>
        </section>
      `;

    case 'faq':
      const faqItems = (section.content.items as Array<{ question: string; answer: string }>) || [];
      return `
        <section class="py-12">
          <div class="max-w-3xl mx-auto px-6">
            ${section.title ? `<h2 class="text-2xl font-bold text-center mb-8">${section.title}</h2>` : ''}
            <div class="space-y-4">
              ${faqItems.map(item => `
                <details class="border border-gray-200 rounded-lg">
                  <summary class="px-6 py-4 cursor-pointer font-medium">${item.question}</summary>
                  <div class="px-6 pb-4 text-muted">${item.answer}</div>
                </details>
              `).join('')}
            </div>
          </div>
        </section>
      `;

    case 'gallery':
      return `
        <section class="py-12">
          <div class="max-w-7xl mx-auto px-6">
            ${section.title ? `
              <div class="text-center mb-8">
                <h2 class="text-2xl font-bold">${section.title}</h2>
                ${section.subtitle ? `<p class="text-muted mt-2">${section.subtitle}</p>` : ''}
              </div>
            ` : ''}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              ${[1, 2, 3, 4].map(() => `
                <div class="aspect-square bg-gray-100 rounded-lg"></div>
              `).join('')}
            </div>
          </div>
        </section>
      `;

    case 'logos':
      return `
        <section class="py-12 bg-alt">
          <div class="max-w-7xl mx-auto px-6">
            ${section.title ? `<h2 class="text-xl font-bold text-center mb-8">${section.title}</h2>` : ''}
            <div class="flex justify-center items-center gap-12 flex-wrap opacity-50">
              ${[1, 2, 3, 4, 5, 6].map(() => `
                <div class="w-24 h-12 bg-gray-300 rounded"></div>
              `).join('')}
            </div>
          </div>
        </section>
      `;

    case 'hero_premium':
      const heroPremiumContent = section.content as { imageUrl?: string; eyebrow?: string; headline?: string; headlineAccent?: string; description?: string; primaryButtonText?: string; secondaryButtonText?: string };
      return `
        <section class="relative min-h-[600px] flex items-center" style="background: url('${heroPremiumContent.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920'}') center/cover;">
          <div class="absolute inset-0" style="background: linear-gradient(90deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 100%);"></div>
          <div class="relative z-10 max-w-7xl mx-auto px-8 md:px-16 w-full">
            <div class="max-w-xl">
              ${heroPremiumContent.eyebrow ? `<p class="text-sm tracking-wider mb-4" style="color: var(--template-primary);">${heroPremiumContent.eyebrow}</p>` : ''}
              <h1 class="text-4xl md:text-5xl font-bold leading-tight mb-4" style="color: var(--template-text);">
                ${heroPremiumContent.headline || 'Argania Premium'}
                ${heroPremiumContent.headlineAccent ? `<br><span style="color: var(--template-primary);">${heroPremiumContent.headlineAccent}</span>` : ''}
              </h1>
              ${heroPremiumContent.description ? `<p class="text-lg mb-8 text-muted">${heroPremiumContent.description}</p>` : ''}
              <div class="flex gap-4">
                ${heroPremiumContent.primaryButtonText ? `<a href="#" class="btn-primary px-8 py-4 font-semibold">${heroPremiumContent.primaryButtonText}</a>` : ''}
                ${heroPremiumContent.secondaryButtonText ? `<a href="#" class="btn-outline px-8 py-4 font-semibold">${heroPremiumContent.secondaryButtonText}</a>` : ''}
              </div>
            </div>
          </div>
        </section>
      `;

    case 'series_grid':
      const seriesItems = (section.content.items as Array<{ id: string; title: string; subtitle?: string; description?: string; imageUrl?: string; gradientFrom?: string; gradientTo?: string }>) || [];
      const seriesSettings = section.settings as { style?: string; columns?: number; mobileColumns?: number; buttonText?: string; cardBackground?: string; minImageHeight?: string; sectionBackground?: string; accentColor?: string; roundedCorners?: boolean };
      const cols = seriesSettings.columns || 3;
      const mobileCols = seriesSettings.mobileColumns || 1;
      const seriesStyle = seriesSettings.style || 'overlay';
      const cardBg = seriesSettings.cardBackground || '#f9f7f4';
      const sectionBg = seriesSettings.sectionBackground || '#ffffff';
      const accentCol = seriesSettings.accentColor || '#d4af37';
      const minImgHeight = seriesSettings.minImageHeight || '200px';
      const seriesBtnText = seriesSettings.buttonText || '';
      const seriesRounded = seriesSettings.roundedCorners !== false ? 'rounded-2xl' : 'rounded-none';
      
      // Cards style - image on top, text below
      if (seriesStyle === 'cards') {
        return `
          <section class="py-16" style="background: ${sectionBg};" data-section-id="${section.id}" data-section-name="גריד סדרות">
            <div class="max-w-7xl mx-auto px-6">
              ${section.title ? `
                <div class="text-center mb-12">
                  ${section.subtitle ? `<span class="text-sm font-bold tracking-wider uppercase" style="color: ${accentCol};">${section.subtitle}</span>` : ''}
                  <h2 class="text-3xl font-bold mt-2" data-section-title>${section.title}</h2>
                  <div class="w-16 h-1 mx-auto mt-4" style="background: ${accentCol};"></div>
                </div>
              ` : ''}
              <div class="grid grid-cols-${mobileCols} md:grid-cols-${cols} gap-6" data-items-grid>
                ${seriesItems.map((item, i) => `
                  <div class="group ${seriesRounded} overflow-hidden shadow-sm hover:shadow-lg transition-all" style="background: ${cardBg};" data-item-id="${item.id}">
                    <div style="min-height: ${minImgHeight};" class="overflow-hidden">
                      ${item.imageUrl 
                        ? `<div class="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style="background-image: url('${item.imageUrl}'); min-height: ${minImgHeight};" data-item-bg></div>`
                        : `<div class="w-full h-full flex items-center justify-center" style="background: linear-gradient(135deg, ${item.gradientFrom || '#d4af37'}, ${item.gradientTo || '#b5952f'}); min-height: ${minImgHeight};" data-item-bg></div>`
                      }
                    </div>
                    <div class="p-5">
                      ${item.subtitle ? `<span class="text-xs font-bold tracking-wider uppercase" style="color: ${accentCol};" data-item-subtitle>${item.subtitle}</span>` : ''}
                      <h3 class="text-lg font-bold mt-1 mb-2" data-item-title>${item.title}</h3>
                      ${item.description ? `<p class="text-sm text-muted leading-relaxed mb-4 line-clamp-3" data-item-description>${item.description}</p>` : ''}
                      ${seriesBtnText ? `
                        <a href="#" class="inline-flex items-center text-sm font-bold" style="color: ${accentCol};" data-card-button>
                          ${seriesBtnText}
                          <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </a>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `;
      }
      
      // Overlay style (default) - full background with hover reveal
      return `
        <section class="py-16" style="background: ${sectionBg};" data-section-id="${section.id}" data-section-name="גריד סדרות">
          <div class="max-w-7xl mx-auto px-6">
            ${section.title ? `
              <div class="text-center mb-12">
                ${section.subtitle ? `<span class="text-sm font-bold tracking-wider uppercase" style="color: ${accentCol};">${section.subtitle}</span>` : ''}
                <h2 class="text-3xl font-bold mt-2" data-section-title>${section.title}</h2>
                <div class="w-16 h-1 mx-auto mt-4" style="background: ${accentCol};"></div>
              </div>
            ` : ''}
            <div class="grid grid-cols-${mobileCols} md:grid-cols-${cols} gap-6" data-items-grid>
              ${seriesItems.map(item => `
                <a href="#" class="group relative h-80 ${seriesRounded} overflow-hidden" data-item-id="${item.id}">
                  ${item.imageUrl 
                    ? `<div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style="background-image: url('${item.imageUrl}');" data-item-bg></div>`
                    : `<div class="absolute inset-0 transition-transform duration-500 group-hover:scale-110" style="background: linear-gradient(135deg, ${item.gradientFrom || '#d4af37'}, ${item.gradientTo || '#b5952f'});" data-item-bg></div>`
                  }
                  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div class="absolute inset-0 flex flex-col justify-end p-6 text-white">
                    <h3 class="text-xl font-bold mb-2" data-item-title>${item.title}</h3>
                    ${item.description ? `<p class="text-sm opacity-90 mb-4" data-item-description>${item.description}</p>` : ''}
                    ${seriesBtnText ? `
                      <span class="inline-flex items-center text-sm font-medium" style="color: ${accentCol};" data-card-button>
                        ${seriesBtnText}
                        <svg class="w-4 h-4 mr-2 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </span>
                    ` : ''}
                  </div>
                </a>
              `).join('')}
            </div>
          </div>
        </section>
      `;

    case 'quote_banner':
      const quoteContent = section.content as { quote: string; attribution?: string; imageUrl?: string };
      return `
        <section class="relative py-24 min-h-[400px] flex items-center justify-center" style="background: url('${quoteContent.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920'}') center/cover fixed;">
          <div class="absolute inset-0 bg-black/50"></div>
          <div class="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
            <blockquote class="text-2xl md:text-3xl italic leading-relaxed mb-6">
              "${quoteContent.quote || 'היופי האמיתי מתחיל מבפנים'}"
            </blockquote>
            ${quoteContent.attribution ? `<cite class="text-sm opacity-80 not-italic">— ${quoteContent.attribution}</cite>` : ''}
          </div>
        </section>
      `;

    case 'hero_slider':
      const slides = (section.content.slides as Array<{ imageUrl: string; title?: string; subtitle?: string; buttonText?: string }>) || [];
      return `
        <section class="relative h-[500px] overflow-hidden">
          <div class="flex h-full overflow-x-auto snap-x snap-mandatory" style="scroll-behavior: smooth; scrollbar-width: none;">
            ${slides.map(slide => `
              <div class="flex-none w-full h-full snap-center relative" style="background: url('${slide.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920'}') center/cover;">
                <div class="absolute inset-0 bg-black/40"></div>
                <div class="absolute inset-0 flex items-center justify-center text-center text-white">
                  <div>
                    ${slide.title ? `<h2 class="text-4xl md:text-5xl font-bold mb-4">${slide.title}</h2>` : ''}
                    ${slide.subtitle ? `<p class="text-xl mb-6 opacity-90">${slide.subtitle}</p>` : ''}
                    ${slide.buttonText ? `<a href="#" class="btn-primary px-8 py-3">${slide.buttonText}</a>` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      `;

    default:
      return `
        <section class="py-12 bg-gray-100">
          <div class="max-w-7xl mx-auto px-6 text-center">
            <p class="text-muted">סקשן: ${section.type}</p>
          </div>
        </section>
      `;
  }
}

// Get SVG icon by name - inline SVGs for zero JS
function getIconSvg(iconName: string, size: number = 24): string {
  const icons: Record<string, string> = {
    truck: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
    refresh: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>`,
    check: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    message: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>`,
    sparkles: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
    heart: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    star: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    crown: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>`,
    package: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
    zap: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    shield: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
    rocket: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
  };
  
  return icons[iconName] || icons['star'];
}

