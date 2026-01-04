import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface StoreFooterProps {
  storeName: string;
  categories?: Category[];
  basePath: string;
}

export function StoreFooter({ storeName, categories = [], basePath }: StoreFooterProps) {
  return (
    <footer className="py-20 px-6 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div>
            <h3 className="font-display text-2xl tracking-[0.3em] mb-6 uppercase">{storeName}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              אופנה מינימליסטית ואיכותית. עיצובים נצחיים שמתאימים לכל סגנון חיים.
            </p>
          </div>
          <div>
            <h4 className="text-[11px] tracking-[0.2em] uppercase text-black mb-6">קטגוריות</h4>
            <ul className="space-y-3">
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link href={`${basePath}/category/${cat.slug}`} className="text-sm text-gray-500 hover:text-black transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] tracking-[0.2em] uppercase text-black mb-6">שירות לקוחות</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><a href="#" className="hover:text-black transition-colors">צור קשר</a></li>
              <li><a href="#" className="hover:text-black transition-colors">משלוחים והחזרות</a></li>
              <li><a href="#" className="hover:text-black transition-colors">מדיניות החזרות</a></li>
              <li><a href="#" className="hover:text-black transition-colors">שאלות נפוצות</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] tracking-[0.2em] uppercase text-black mb-6">עקבו אחרינו</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><a href="#" className="hover:text-black transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-black transition-colors">TikTok</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400 tracking-wide">
            © 2025 {storeName}. כל הזכויות שמורות.
          </p>
          <p className="text-xs text-gray-300 tracking-wide">
            נבנה עם QuickShop ⚡
          </p>
        </div>
      </div>
    </footer>
  );
}

