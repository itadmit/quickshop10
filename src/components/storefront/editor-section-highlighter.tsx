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
      if (event.data?.type === 'THEME_SETTINGS_UPDATE') {
        // Already handled by PreviewSettingsProvider
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

