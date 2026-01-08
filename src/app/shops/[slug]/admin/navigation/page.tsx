import { getStoreBySlug, getCategoriesByStore } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { menus, menuItems, pages } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { MenuEditor } from './menu-editor';

// Menu item with image support
interface MenuItemWithImage {
  id: string;
  menuId: string;
  parentId: string | null;
  title: string;
  linkType: 'url' | 'page' | 'category' | 'product';
  linkUrl: string | null;
  linkResourceId: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default async function NavigationPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get or create default menus
  let storeMenus = await db
    .select()
    .from(menus)
    .where(eq(menus.storeId, store.id));

  // Create default menus if none exist
  const defaultMenus = [
    { name: 'תפריט ראשי', handle: 'main' },
    { name: 'תפריט תחתון', handle: 'footer' },
  ];

  for (const defaultMenu of defaultMenus) {
    if (!storeMenus.find(m => m.handle === defaultMenu.handle)) {
      const [newMenu] = await db.insert(menus).values({
        storeId: store.id,
        name: defaultMenu.name,
        handle: defaultMenu.handle,
      }).returning();
      storeMenus.push(newMenu);
    }
  }

  // Get menu items for each menu (including imageUrl)
  const menusWithItems = await Promise.all(
    storeMenus.map(async (menu) => {
      const items = await db
        .select({
          id: menuItems.id,
          menuId: menuItems.menuId,
          parentId: menuItems.parentId,
          title: menuItems.title,
          linkType: menuItems.linkType,
          linkUrl: menuItems.linkUrl,
          linkResourceId: menuItems.linkResourceId,
          imageUrl: menuItems.imageUrl,
          sortOrder: menuItems.sortOrder,
          isActive: menuItems.isActive,
        })
        .from(menuItems)
        .where(eq(menuItems.menuId, menu.id))
        .orderBy(asc(menuItems.sortOrder));
      return { ...menu, items: items as MenuItemWithImage[] };
    })
  );

  // Get available pages and categories for linking
  const storePages = await db
    .select({ id: pages.id, title: pages.title, slug: pages.slug })
    .from(pages)
    .where(eq(pages.storeId, store.id));

  const categories = await getCategoriesByStore(store.id);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ניווט</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">ניהול תפריטים וקישורים באתר</p>
      </div>

      {/* Menus */}
      {menusWithItems.map((menu) => (
        <div key={menu.id} className="bg-white rounded-xl border border-gray-200">
          <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm sm:text-base">{menu.name}</h2>
              <p className="text-[10px] sm:text-xs text-gray-500">handle: {menu.handle}</p>
            </div>
          </div>
          <MenuEditor
            menu={menu}
            items={menu.items}
            slug={slug}
            availablePages={storePages}
            availableCategories={categories}
          />
        </div>
      ))}

      {/* Info */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 sm:p-6">
        <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">מידע על התפריטים</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-900 text-sm">תפריט ראשי (main)</p>
            <p>מוצג בכותרת האתר - ניווט ראשי לעמודים וקטגוריות</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">תפריט תחתון (footer)</p>
            <p>מוצג בתחתית האתר - קישורים לעמודי מידע ומדיניות</p>
          </div>
        </div>
      </div>
    </div>
  );
}

