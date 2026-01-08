import Link from 'next/link';
import { db } from '@/lib/db';
import { menus, menuItems, categories } from '@/lib/db/schema';
import { eq, and, asc, isNull } from 'drizzle-orm';
import { cache } from 'react';

// Types
interface MenuItem {
  id: string;
  title: string;
  linkType: 'url' | 'page' | 'category' | 'product';
  linkUrl: string | null;
  linkResourceId: string | null;
  parentId: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

interface MenuItemWithChildren extends MenuItem {
  children: MenuItemWithChildren[];
}

// Cached menu fetcher - Server only
const getMainMenu = cache(async (storeId: string) => {
  // Get main menu
  const [menu] = await db
    .select()
    .from(menus)
    .where(and(eq(menus.storeId, storeId), eq(menus.handle, 'main')));

  if (!menu) return null;

  // Get all menu items
  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.menuId, menu.id))
    .orderBy(asc(menuItems.sortOrder));

  // Get all categories for resolving links
  const storeCategories = await db
    .select({ id: categories.id, slug: categories.slug, name: categories.name })
    .from(categories)
    .where(eq(categories.storeId, storeId));

  const categoryMap = new Map(storeCategories.map(c => [c.id, c]));

  return { menu, items, categoryMap };
});

// Build hierarchical menu structure
function buildMenuTree(items: MenuItem[]): MenuItemWithChildren[] {
  const itemMap = new Map<string, MenuItemWithChildren>();
  const roots: MenuItemWithChildren[] = [];

  // First pass: create all items with empty children
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Second pass: build tree
  items.forEach(item => {
    const node = itemMap.get(item.id)!;
    if (item.parentId && itemMap.has(item.parentId)) {
      itemMap.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// Get link URL for a menu item
function getItemUrl(
  item: MenuItem,
  categoryMap: Map<string, { id: string; slug: string; name: string }>,
  storeSlug: string
): string {
  if (item.linkType === 'url' && item.linkUrl) {
    return item.linkUrl;
  }
  if (item.linkType === 'category' && item.linkResourceId) {
    const cat = categoryMap.get(item.linkResourceId);
    return cat ? `/shops/${storeSlug}/category/${cat.slug}` : '#';
  }
  if (item.linkType === 'page' && item.linkResourceId) {
    return `/shops/${storeSlug}/page/${item.linkResourceId}`;
  }
  return '#';
}

// Props
interface MegaMenuProps {
  storeId: string;
  storeSlug: string;
  className?: string;
}

// Main Component - Server Component, Zero JS!
export async function MegaMenu({ storeId, storeSlug, className = '' }: MegaMenuProps) {
  const menuData = await getMainMenu(storeId);

  if (!menuData || menuData.items.length === 0) {
    return null;
  }

  const { items, categoryMap } = menuData;
  const menuTree = buildMenuTree(items as MenuItem[]);

  return (
    <nav className={`mega-menu ${className}`}>
      <ul className="flex items-center gap-1">
        {menuTree.map((item) => (
          <MegaMenuItem
            key={item.id}
            item={item}
            categoryMap={categoryMap}
            storeSlug={storeSlug}
          />
        ))}
      </ul>

      {/* CSS-only mega menu styles */}
      <style>{`
        .mega-menu-item {
          position: relative;
        }
        .mega-menu-item > .mega-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          min-width: 100vw;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.15s ease, visibility 0.15s ease;
          pointer-events: none;
          z-index: 50;
        }
        .mega-menu-item:hover > .mega-dropdown,
        .mega-menu-item:focus-within > .mega-dropdown {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        .mega-column:hover .mega-column-image {
          opacity: 1;
        }
      `}</style>
    </nav>
  );
}

// Individual menu item
function MegaMenuItem({
  item,
  categoryMap,
  storeSlug,
}: {
  item: MenuItemWithChildren;
  categoryMap: Map<string, { id: string; slug: string; name: string }>;
  storeSlug: string;
}) {
  const hasChildren = item.children.length > 0;
  const url = getItemUrl(item, categoryMap, storeSlug);

  if (!hasChildren) {
    // Simple link without dropdown
    return (
      <li>
        <Link
          href={url}
          className="block px-4 py-2 text-sm font-medium hover:text-gray-600 transition-colors"
        >
          {item.title}
        </Link>
      </li>
    );
  }

  // Mega menu with dropdown
  return (
    <li className="mega-menu-item">
      <Link
        href={url}
        className="flex items-center gap-1 px-4 py-2 text-sm font-medium hover:text-gray-600 transition-colors"
      >
        {item.title}
        <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2">
          <path d="M3 4.5l3 3 3-3" />
        </svg>
      </Link>

      {/* Mega Dropdown */}
      <div className="mega-dropdown">
        <div className="bg-white border-t border-gray-200 shadow-xl">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex gap-8">
              {/* Columns */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {item.children.map((column) => (
                  <MegaColumn
                    key={column.id}
                    item={column}
                    categoryMap={categoryMap}
                    storeSlug={storeSlug}
                  />
                ))}
              </div>

              {/* Featured Image from parent or first child with image */}
              <MegaMenuImage item={item} />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

// Column in mega menu
function MegaColumn({
  item,
  categoryMap,
  storeSlug,
}: {
  item: MenuItemWithChildren;
  categoryMap: Map<string, { id: string; slug: string; name: string }>;
  storeSlug: string;
}) {
  const url = getItemUrl(item, categoryMap, storeSlug);

  return (
    <div className="mega-column group">
      <Link
        href={url}
        className="block font-semibold text-gray-900 hover:text-gray-600 mb-3 transition-colors"
      >
        {item.title}
      </Link>

      {item.children.length > 0 && (
        <ul className="space-y-2">
          {item.children.map((subItem) => (
            <li key={subItem.id}>
              <Link
                href={getItemUrl(subItem, categoryMap, storeSlug)}
                className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {subItem.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Image component for mega menu
function MegaMenuImage({ item }: { item: MenuItemWithChildren }) {
  // Find first image from item or its children
  const findImage = (menuItem: MenuItemWithChildren): string | null => {
    if (menuItem.imageUrl) return menuItem.imageUrl;
    for (const child of menuItem.children) {
      const childImage = findImage(child);
      if (childImage) return childImage;
    }
    return null;
  };

  const imageUrl = findImage(item);

  if (!imageUrl) return null;

  return (
    <div className="hidden lg:block w-64 flex-shrink-0">
      <div className="aspect-[4/5] bg-gray-100 overflow-hidden rounded-lg">
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    </div>
  );
}

// Export for use in header
export default MegaMenu;

