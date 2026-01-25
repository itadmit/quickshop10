/**
 * Editor Controls - Reusable settings components
 * הגדרות קבועות לשימוש חוזר בכל הסקשנים
 * 
 * כל הגדרה שאפשר לשנות = חייבת להתעדכן באייפריים מיידית
 * אותה קומפוננטה = אותה התנהגות בכל מקום
 */

// Typography settings
export { TypographyControl, TypographyInline } from './TypographyControl';

// Button settings
export { ButtonControl, ButtonColorsInline } from './ButtonControl';

// Spacing settings
export { 
  SpacingControl, 
  PaddingControl, 
  MarginControl, 
  GapControl 
} from './SpacingControl';

// Background settings
export { 
  BackgroundControl, 
  BackgroundColorControl, 
  CardBackgroundControl,
  FullBackgroundControl,
  MinHeightControl,
} from './BackgroundControl';

// Grid/Layout settings
export { 
  GridControl, 
  ColumnsControl, 
  MaxWidthControl,
  SectionWidthControl,
  AlignmentControl,
  VerticalAlignControl,
} from './GridControl';

// Advanced settings (margin, padding, z-index, CSS ID/Classes)
export { AdvancedControl } from './AdvancedControl';

// Visibility settings (hide on mobile/desktop)
export { VisibilityControl } from './VisibilityControl';
