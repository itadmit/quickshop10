/**
 * Common Editor Settings Components
 * קומפוננטות משותפות להגדרות אדיטור
 */

// Field Components - Basic form controls
export {
  SettingsGroup,
  CollapsibleGroup,
  TextField,
  TextAreaField,
  SelectField,
  ToggleField,
  SwitchField,
  SliderField,
  ColorField,
  NumberField,
  ImageField,
  UrlField,
  IconSelectField,
  AlignmentField,
  Divider,
  SectionHeader,
} from './field-components';

// Typography Settings
export {
  SingleTypography,
  TitleTypography,
  SubtitleTypography,
  TextTypography,
  FullTypography,
  // Legacy aliases
  TitleTypographySettings,
  SubtitleTypographySettings,
  TextTypographySettings,
  FullTypographySettings,
} from './typography-settings';

// Spacing Settings
export {
  PaddingTopControl,
  PaddingBottomControl,
  PaddingYControl,
  MarginTopControl,
  MarginBottomControl,
  FullSpacing,
} from './spacing-settings';

// Grid Settings
export {
  ColumnsControl,
  MobileColumnsControl,
  GapControl,
  LayoutTypeControl,
  FullGrid,
} from './grid-settings';

// Background Settings
export {
  BackgroundColorControl,
  OverlayControl,
  CardBackgroundControl,
  FullBackground,
} from './background-settings';

// Slider Settings
export { SliderSettings } from './slider-settings';

// Alignment Settings
export { 
  AlignmentSettings,
  LayoutSettings,
} from './alignment-settings';
