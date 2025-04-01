_Last updated: 2025-04-01 14:55 EST — v1.0_

# Frontend Guidelines

## Design System

### Color Palette

#### Primary Colors
- **Primary-50**: `#f0f9ff` - Lightest background, hover states
- **Primary-100**: `#e0f2fe` - Light background, disabled states
- **Primary-200**: `#bae6fd` - Borders, dividers
- **Primary-300**: `#7dd3fc` - Secondary buttons, focus rings
- **Primary-400**: `#38bdf8` - Hover states, secondary elements
- **Primary-500**: `#0ea5e9` - Primary UI elements, main buttons
- **Primary-600**: `#0284c7` - Primary text on light backgrounds
- **Primary-700**: `#0369a1` - Hover states for dark elements
- **Primary-800**: `#075985` - Dark UI elements, headings
- **Primary-900**: `#0c4a6e` - Darkest elements, backgrounds

#### Neutral Colors
- **Gray-50**: `#f9fafb` - Page background
- **Gray-100**: `#f3f4f6` - Card background, light mode
- **Gray-200**: `#e5e7eb` - Borders, dividers
- **Gray-300**: `#d1d5db` - Disabled text, icons
- **Gray-400**: `#9ca3af` - Placeholder text
- **Gray-500**: `#6b7280` - Secondary text
- **Gray-600**: `#4b5563` - Primary text
- **Gray-700**: `#374151` - Headings
- **Gray-800**: `#1f2937` - Dark backgrounds
- **Gray-900**: `#111827` - Darkest elements

#### Semantic Colors
- **Success**: `#10b981` - Success states, positive actions
- **Warning**: `#f59e0b` - Warning states, caution
- **Error**: `#ef4444` - Error states, destructive actions
- **Info**: `#3b82f6` - Information states, help

### Typography

#### Font Families
- **Primary Font**: 'Inter', sans-serif
- **Monospace Font**: 'Roboto Mono', monospace (for timestamps, code)

#### Heading Styles
- **H1**: 36px/2.25rem, weight 700, line-height 1.2, letter-spacing -0.025em
- **H2**: 30px/1.875rem, weight 700, line-height 1.3, letter-spacing -0.025em
- **H3**: 24px/1.5rem, weight 600, line-height 1.4, letter-spacing -0.01em
- **H4**: 20px/1.25rem, weight 600, line-height 1.4, letter-spacing -0.01em
- **H5**: 18px/1.125rem, weight 600, line-height 1.5, letter-spacing normal
- **H6**: 16px/1rem, weight 600, line-height 1.5, letter-spacing normal

#### Body Text
- **Body Large**: 18px/1.125rem, weight 400, line-height 1.6
- **Body Default**: 16px/1rem, weight 400, line-height 1.6
- **Body Small**: 14px/0.875rem, weight 400, line-height 1.6
- **Caption**: 12px/0.75rem, weight 400, line-height 1.5, letter-spacing 0.01em

#### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

### Spacing System

#### Base Spacing
Base unit: 4px (0.25rem)

#### Spacing Scale
- **space-0**: 0
- **space-1**: 4px (0.25rem)
- **space-2**: 8px (0.5rem)
- **space-3**: 12px (0.75rem)
- **space-4**: 16px (1rem)
- **space-5**: 20px (1.25rem)
- **space-6**: 24px (1.5rem)
- **space-8**: 32px (2rem)
- **space-10**: 40px (2.5rem)
- **space-12**: 48px (3rem)
- **space-16**: 64px (4rem)
- **space-20**: 80px (5rem)
- **space-24**: 96px (6rem)

#### Layout Spacing
- **Page Padding (Desktop)**: 32px (2rem)
- **Page Padding (Tablet)**: 24px (1.5rem)
- **Page Padding (Mobile)**: 16px (1rem)
- **Card Padding**: 24px (1.5rem)
- **Section Spacing**: 64px (4rem)

### Border Radius
- **radius-none**: 0
- **radius-sm**: 2px (0.125rem)
- **radius-default**: 4px (0.25rem)
- **radius-md**: 6px (0.375rem)
- **radius-lg**: 8px (0.5rem)
- **radius-xl**: 12px (0.75rem)
- **radius-2xl**: 16px (1rem)
- **radius-full**: 9999px

### Shadows
- **shadow-sm**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **shadow-default**: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)`
- **shadow-md**: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- **shadow-lg**: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- **shadow-xl**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`
- **shadow-inner**: `inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)`

## Components

### Button System

#### Button Sizes
- **Button XS**: padding: 6px 12px, text: 12px, height: 24px
- **Button SM**: padding: 8px 16px, text: 14px, height: 32px
- **Button MD**: padding: 10px 20px, text: 16px, height: 40px
- **Button LG**: padding: 12px 24px, text: 18px, height: 48px

#### Button Variants
- **Primary**: Solid background with the primary color
- **Secondary**: Lighter background with primary outline
- **Outline**: White/transparent background with colored outline
- **Ghost**: No background/border until hover
- **Destructive**: Red background for destructive actions
- **Link**: Appears as a text link with button behavior

#### Button States
- **Default**: Normal state
- **Hover**: Slightly darker/lighter than default
- **Focus**: Focus ring with keyboard navigation
- **Active**: Pressed state
- **Disabled**: Muted colors, no hover effects
- **Loading**: Loading spinner, disabled interaction

### Form Elements

#### Text Inputs
- Height: 40px (2.5rem)
- Padding: 8px 12px
- Border: 1px solid gray-300
- Border Radius: radius-md
- Background: white (light mode), gray-800 (dark mode)
- States: Default, Focus, Disabled, Error

#### Select Inputs
- Same base styling as text inputs
- Custom dropdown indicator
- Support for option groups
- Multiple selection variant

#### Checkboxes and Radio Buttons
- Size: 16px × 16px
- Custom styled indicators
- Accessible keyboard navigation
- Support for indeterminate state (checkboxes)

#### Textarea
- Min Height: 80px
- Resize: vertical
- Same styling as text inputs

#### Form Layout
- Vertical spacing between fields: 24px (1.5rem)
- Label spacing: 8px (0.5rem) below label
- Help text: 4px (0.25rem) below input
- Error text: 4px (0.25rem) below input, error color

### Card System
- Padding: 24px (1.5rem)
- Border Radius: radius-lg
- Background: white (light mode), gray-800 (dark mode)
- Border: 1px solid gray-200 (light mode), gray-700 (dark mode)
- Shadow: shadow-md
- Content spacing: 16px (1rem) between sections

### Video Player
- Seek Bar:
  - Height: 6px (0.375rem)
  - Track Color: gray-200
  - Fill Color: primary-500
  - Hover Height: 8px (0.5rem)
- Controls:
  - Background: gradient from transparent to semi-black
  - Icon Size: 20px (1.25rem)
  - Button Padding: 8px (0.5rem)
- Timestamp Markers:
  - Size: 10px diameter
  - Color: By comment category or default primary
  - Hover: Scale to 14px with tooltip

## Animation Guidelines

### Transition Defaults
- **Default Timing**: 150ms
- **Default Easing**: cubic-bezier(0.4, 0, 0.2, 1) (ease-in-out)
- **Enter Easing**: cubic-bezier(0, 0, 0.2, 1) (ease-out)
- **Exit Easing**: cubic-bezier(0.4, 0, 1, 1) (ease-in)

### Animation Types

#### Micro-Interactions
- **Button Hover**: 100ms scale and background color
- **Input Focus**: 150ms border and shadow
- **Checkbox Toggle**: 200ms with slight bounce
- **Ripple Effect**: 300ms radial expansion

#### Content Transitions
- **Page Transitions**: 300ms fade and slide
- **Modal Enter/Exit**: 250ms fade and scale
- **Sidebar Open/Close**: 250ms slide
- **List Item Enter**: 200ms fade and slide, staggered by 50ms per item

#### Loading States
- **Spinner**: Continuous 1s rotation
- **Skeleton Loading**: 1.5s background gradient animation
- **Progress Bar**: Linear or determinate progress animation

### Animation Rules
1. Keep animations under 300ms for UI feedback
2. Use longer durations (300-500ms) only for significant view changes
3. Always provide reduced-motion alternatives
4. Avoid animations that block user interaction
5. Ensure animations start and end in a clean state

## Responsive Breakpoints

### Breakpoint System
- **xs**: 0px (base)
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Responsive Rules
1. Design mobile-first, then scale up
2. Adjust spacing and typography at breakpoints
3. Use grid systems with appropriate column counts:
   - 1 column for xs
   - 2 columns for sm
   - 3-4 columns for md
   - 4-6 columns for lg and above
4. Stack elements vertically on smaller screens
5. Hide secondary information on mobile
6. Ensure touch targets are at least 44×44px on mobile

## Accessibility Guidelines

### Color Contrast
- Text must maintain 4.5:1 contrast ratio with background
- Large text (18pt or 14pt bold) must maintain 3:1 contrast ratio
- UI components and graphical objects must maintain 3:1 contrast ratio

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Focus states must be clearly visible
- Logical tab order following visual layout
- Provide keyboard shortcuts for power users (with documentation)

### Screen Reader Support
- All images must have alt text
- Form controls must have associated labels
- ARIA roles and attributes for custom components
- Proper heading hierarchy (h1-h6)
- Landmark regions (main, nav, aside, etc.)

### Reduced Motion
- Respect `prefers-reduced-motion` media query
- Provide non-animated alternatives
- Avoid animations that could trigger vestibular disorders

## Component Documentation

### Documentation Template
Each component should include:
1. Visual example
2. Component API (props, events)
3. Code examples for common use cases
4. Accessibility considerations
5. Responsive behavior
6. Variants and states

### Usage Guidelines
For each main component, document:
1. When to use this component
2. When to use an alternative
3. Composition with other components
4. Common patterns and anti-patterns

## Icon System

### Icon Guidelines
- Base Size: 20×20px
- Stroke Width: 2px
- Corner Radius: 2px
- Default Color: currentColor (inherits from text)
- Export Format: SVG
- Support for size variants (16, 20, 24px)

### Icon Categories
- Navigation
- Actions
- Objects
- Feedback/Status
- Music notation specific

## Image Usage

### Image Size Guidelines
- Hero Images: 1600×900px, 16:9 ratio
- Card Thumbnails: 400×225px, 16:9 ratio
- Profile Pictures: 200×200px, 1:1 ratio
- Icon Graphics: 48×48px, 1:1 ratio

### Image Optimization
- Format: WebP with JPEG fallback
- Compression: 80-85% quality
- Lazy Loading: For all below-the-fold images
- Responsive Srcsets: Multiple resolutions based on viewport

## Code Standards

### Component Structure
- One component per file
- Components organized by feature/domain
- Common components in shared directory
- Consistent naming convention (PascalCase)

### CSS Guidelines
- Use Tailwind utility classes as primary styling method
- Use CSS Modules for complex custom components
- Follow BEM-like class naming for custom CSS
- Keep media queries consistent with breakpoint system

### JavaScript/TypeScript Standards
- Strongly typed props with interfaces
- Function components with hooks
- Appropriate error boundaries
- Event handlers prefixed with "handle"
- Prop callbacks prefixed with "on"