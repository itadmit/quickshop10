/**
 * Section Types - Shared types for all section components
 * טיפוסים משותפים לכל סקשן
 */

export interface Section {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  isActive?: boolean;
  order?: number;
}

export interface SectionHandler {
  (element: Element, updates: Partial<Section>): void;
}

export interface SectionConfig {
  type: string;
  name: string;
  icon: string;
  defaultTitle?: string;
  defaultSubtitle?: string;
  defaultContent: Record<string, unknown>;
  defaultSettings: Record<string, unknown>;
}

// Handler registry type
export type SectionHandlers = Record<string, SectionHandler>;

