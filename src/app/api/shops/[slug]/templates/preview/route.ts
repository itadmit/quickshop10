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
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&family=Lato:wght@400;700&family=Space+Grotesk:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600;700&display=swap" rel="stylesheet">
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
      const features = (section.content.features as Array<{ emoji: string; title: string; description: string }>) || [];
      return `
        <section class="py-12 bg-alt">
          <div class="max-w-7xl mx-auto px-6">
            ${section.title ? `<h2 class="text-2xl font-bold text-center mb-8">${section.title}</h2>` : ''}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              ${features.map(f => `
                <div class="text-center">
                  <div class="text-3xl mb-2">${f.emoji}</div>
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
            ${section.content.icon ? `<span class="text-2xl mb-2 block">${section.content.icon}</span>` : ''}
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

