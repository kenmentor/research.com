## ADDED Requirements
### Requirement: LinkedIn-Token Theme via CSS Variables
The theme SHALL define LinkedIn-inspired brand, surface, and text tokens exclusively as CSS variables and MUST apply them consistently to backgrounds, text, and interactive elements.
#### Scenario: Token-driven styling
- **WHEN** the application renders in light mode with the theme loaded
- **THEN** all brand surfaces, text, and actions resolve colors from the defined CSS variables with no hardcoded brand hex values in components
### Requirement: Responsive AppShell Layout
The AppShell SHALL render a three-column layout on desktop and a single-column layout with bottom-tab navigation on mobile viewports and MUST preserve navigation state across viewport changes.
#### Scenario: Desktop to mobile adaptation
- **WHEN** the viewport changes from desktop width to mobile width
- **THEN** side columns collapse into a bottom tab bar while primary navigation destinations remain reachable without reload
### Requirement: shadcn Primitives Only
All interface elements SHALL be composed exclusively from shadcn primitives plus project theme tokens and MUST NOT introduce custom raw HTML controls or third-party UI kits for standard controls.
#### Scenario: Primitive-only audit
- **WHEN** the component tree is audited for buttons, inputs, cards, avatars, and navigation elements
- **THEN** every such element traces to a shadcn primitive and no non-shadcn UI kit component is present
### Requirement: Mobile Sheet Replaces Dialog
The interface SHALL render modal content with Sheet drawers on mobile breakpoints and Dialog overlays on desktop breakpoints and MUST switch presentation automatically by viewport width.
#### Scenario: Adaptive modal presentation
- **WHEN** a modal is opened on a mobile viewport versus a desktop viewport
- **THEN** the mobile open renders a Sheet drawer and the desktop open renders a centered Dialog with identical content and actions
### Requirement: Skeleton Empty and Error States
Every data-driven view SHALL provide loading skeleton, empty, and error states and MUST never render a blank panel while data is pending or missing.
#### Scenario: State coverage
- **WHEN** a feed, list, or detail view is loading, has zero items, or fails to fetch
- **THEN** the view shows a skeleton placeholder, an empty illustration with a recovery action, or an error block with retry respectively
### Requirement: Dark Mode Variables with Light Default
The theme SHALL ship a complete dark-mode variable set alongside the light default and MUST default to light mode with persistence of the user-selected mode across sessions.
#### Scenario: Mode toggle and persistence
- **WHEN** a user toggles dark mode and reloads the application
- **THEN** dark-mode variables apply after the toggle and the selected mode persists after reload with light mode as the initial default
