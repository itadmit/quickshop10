'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Editor Section Highlighter
 * 
 * ONLY loaded in preview mode (editor iframe).
 * Adds:
 * - Scroll to section on command from editor
 * - Hover outline on sections
 * - Click to select section
 * 
 * PERFORMANCE: Zero overhead in production (never loaded)
 */

export function EditorSectionHighlighter() {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Find all sections with data-section-id
  const getSectionElements = useCallback(() => {
    return document.querySelectorAll('[data-section-id]');
  }, []);

  // Scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSelectedSection(sectionId);
    }
  }, []);

  // Handle messages from editor
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SCROLL_TO_SECTION') {
        scrollToSection(event.data.sectionId);
      }
      if (event.data?.type === 'HIGHLIGHT_SECTION') {
        // Update selected section (can be null to clear)
        setSelectedSection(event.data.sectionId);
      }
      if (event.data?.type === 'THEME_SETTINGS_UPDATE') {
        // Already handled by PreviewSettingsProvider
      }
      if (event.data?.type === 'SECTION_CONTENT_UPDATE') {
        // Live update section content in DOM
        const { sectionId, updates } = event.data;
        const element = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (element) {
          // Update title (show/hide based on content)
          if (updates.title !== undefined) {
            const titleEl = element.querySelector('[data-section-title]') as HTMLElement;
            if (titleEl) {
              titleEl.textContent = updates.title;
              // Show if has content, hide if empty
              if (updates.title) {
                titleEl.classList.remove('hidden');
                titleEl.classList.add('mb-4');
              } else {
                titleEl.classList.add('hidden');
                titleEl.classList.remove('mb-4');
              }
            }
          }
          // Update subtitle (show/hide based on content)
          if (updates.subtitle !== undefined) {
            const subtitleEl = element.querySelector('[data-section-subtitle]') as HTMLElement;
            if (subtitleEl) {
              subtitleEl.textContent = updates.subtitle;
              // Show if has content, hide if empty
              if (updates.subtitle) {
                subtitleEl.classList.remove('hidden');
                subtitleEl.classList.add('mb-20');
              } else {
                subtitleEl.classList.add('hidden');
                subtitleEl.classList.remove('mb-20');
              }
            }
          }
          // Update content.buttonText
          if (updates.content?.buttonText !== undefined) {
            const btnEl = element.querySelector('[data-section-button]');
            if (btnEl) btnEl.textContent = updates.content.buttonText;
          }
          
          // Update category visibility based on selection
          if (updates.content?.categoryIds !== undefined) {
            const categoryIds = updates.content.categoryIds as string[] || [];
            const categoryElements = element.querySelectorAll('[data-category-id]');
            categoryElements.forEach((catEl) => {
              const catId = (catEl as HTMLElement).dataset.categoryId;
              if (categoryIds.length === 0 || (catId && categoryIds.includes(catId))) {
                catEl.classList.remove('hidden');
              } else {
                catEl.classList.add('hidden');
              }
            });
            // Update data attribute
            (element as HTMLElement).dataset.selectedCategories = categoryIds.join(',');
          }
          
          // Update product limit visibility
          if (updates.content?.limit !== undefined) {
            const limit = updates.content.limit as number;
            const productElements = element.querySelectorAll('[data-product-index]');
            productElements.forEach((prodEl) => {
              const index = parseInt((prodEl as HTMLElement).dataset.productIndex || '0', 10);
              if (index < limit) {
                prodEl.classList.remove('hidden');
              } else {
                prodEl.classList.add('hidden');
              }
            });
            // Update data attribute
            (element as HTMLElement).dataset.displayLimit = String(limit);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [scrollToSection]);

  // Add hover/click listeners to sections
  useEffect(() => {
    const sections = getSectionElements();
    
    const handleMouseEnter = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const sectionId = target.dataset.sectionId;
      if (sectionId) setHoveredSection(sectionId);
    };

    const handleMouseLeave = () => {
      setHoveredSection(null);
    };

    const handleClick = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const sectionId = target.dataset.sectionId;
      if (sectionId) {
        // Send message to parent (editor)
        window.parent.postMessage({
          type: 'SECTION_CLICKED',
          sectionId,
        }, '*');
        setSelectedSection(sectionId);
      }
    };

    sections.forEach(section => {
      section.addEventListener('mouseenter', handleMouseEnter);
      section.addEventListener('mouseleave', handleMouseLeave);
      section.addEventListener('click', handleClick);
    });

    return () => {
      sections.forEach(section => {
        section.removeEventListener('mouseenter', handleMouseEnter);
        section.removeEventListener('mouseleave', handleMouseLeave);
        section.removeEventListener('click', handleClick);
      });
    };
  }, [getSectionElements]);

  // Inject styles for highlighted sections + disable links
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'editor-highlighter-styles';
    style.textContent = `
      /* Disable all links in preview mode */
      a {
        pointer-events: none !important;
        cursor: default !important;
      }
      
      /* But allow clicks on sections */
      [data-section-id] {
        position: relative;
        cursor: pointer !important;
        pointer-events: auto !important;
        transition: outline 0.15s ease;
      }
      [data-section-id]:hover {
        outline: 2px dashed #3b82f6 !important;
        outline-offset: 2px;
      }
      [data-section-id].editor-selected {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px;
      }
      [data-section-id]::before {
        content: attr(data-section-name);
        position: absolute;
        top: 0;
        right: 0;
        background: #3b82f6;
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        opacity: 0;
        transition: opacity 0.15s ease;
        pointer-events: none;
        z-index: 100;
        font-family: system-ui, sans-serif;
      }
      [data-section-id]:hover::before {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const existingStyle = document.getElementById('editor-highlighter-styles');
      if (existingStyle) existingStyle.remove();
    };
  }, []);

  // Update selected class on sections
  useEffect(() => {
    const sections = getSectionElements();
    sections.forEach(section => {
      const sectionId = (section as HTMLElement).dataset.sectionId;
      if (sectionId === selectedSection) {
        section.classList.add('editor-selected');
      } else {
        section.classList.remove('editor-selected');
      }
    });
  }, [selectedSection, getSectionElements]);

  // This component doesn't render anything visible
  return null;
}

