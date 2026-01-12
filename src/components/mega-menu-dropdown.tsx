'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface MenuItem {
  id: string;
  title: string;
  resolvedUrl?: string;
  imageUrl?: string | null;
  children?: MenuItem[];
}

interface MegaMenuDropdownProps {
  item: MenuItem;
  basePath: string;
  bgColor?: string;
}

export function MegaMenuDropdown({ item, basePath, bgColor = '#f9fafb' }: MegaMenuDropdownProps) {
  const children = item.children || [];
  const [hoveredChildId, setHoveredChildId] = useState<string | null>(null);
  
  // Get the image to display - hovered child's image or default
  const getDisplayImage = () => {
    if (hoveredChildId) {
      const hoveredChild = children.find(c => c.id === hoveredChildId);
      if (hoveredChild?.imageUrl) return hoveredChild.imageUrl;
    }
    // Default: parent's image or first child with image
    return item.imageUrl || children.find(c => c.imageUrl)?.imageUrl;
  };

  const displayImage = getDisplayImage();
  const hasAnyImage = item.imageUrl || children.some(c => c.imageUrl);

  return (
    <div className="border-t border-b border-gray-200 shadow-lg" style={{ backgroundColor: bgColor }}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8">
        <div className="flex justify-between gap-12" dir="rtl">
          {/* Menu columns - vertical layout on the right */}
          <div className="min-w-[220px]">
            <div className="flex flex-col">
              {children.map((child) => {
                const childHref = child.resolvedUrl?.startsWith('/') ? `${basePath}${child.resolvedUrl}` : child.resolvedUrl || '#';
                const grandchildren = child.children || [];
                const isHovered = hoveredChildId === child.id;
                
                return (
                  <div 
                    key={child.id}
                    onMouseEnter={() => setHoveredChildId(child.id)}
                  >
                    <Link
                      href={childHref}
                      className={`block text-sm font-semibold py-3 px-4 rounded-lg transition-all duration-200 ${
                        isHovered 
                          ? 'bg-gray-100 text-black' 
                          : 'text-gray-900 hover:bg-gray-50 hover:text-black'
                      }`}
                    >
                      {child.title}
                    </Link>
                    {grandchildren.length > 0 && (
                      <div className="pr-6 pb-2 space-y-1">
                        {grandchildren.map((grandchild) => {
                          const grandchildHref = grandchild.resolvedUrl?.startsWith('/') ? `${basePath}${grandchild.resolvedUrl}` : grandchild.resolvedUrl || '#';
                          return (
                            <Link
                              key={grandchild.id}
                              href={grandchildHref}
                              className="block text-xs text-gray-500 hover:text-black hover:bg-gray-50 transition-colors py-2 px-4 rounded"
                            >
                              {grandchild.title}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Image section - on the far left */}
          {hasAnyImage && (
            <div className="w-[320px] flex-shrink-0">
              <div className="relative w-full aspect-square bg-gray-50 overflow-hidden rounded-lg">
                {displayImage && (
                  <Image
                    src={displayImage}
                    alt={item.title}
                    fill
                    className="object-contain transition-opacity duration-300"
                    sizes="320px"
                    key={displayImage} // Force re-render on image change
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

