# Spec Delta: dashboard-shell

## Purpose
Provides the foundational responsive application shell inspired by Treinta, supporting desktop sidebar, mobile drawer, active business indicator, module navigation links, and session actions.

## ADDED Requirements

### Requirement: Responsive Navigation Shell
The application dashboard SHALL present a responsive navigation interface tailored for both desktop and mobile viewports.

#### Scenario: Desktop Navigation Layout
- **WHEN** an authenticated user with an active business accesses `/dashboard` on a desktop viewport
- **THEN** a persistent sidebar is displayed on the left containing the business identity, navigation items (Inicio, Movimientos, Inventario, Caja, Reportes, Configuración), and user sign-out action.

#### Scenario: Mobile Navigation Drawer
- **WHEN** an authenticated user accesses `/dashboard` on a mobile viewport
- **THEN** a top bar with the active business title and hamburger toggle is rendered, which opens a sliding drawer containing all navigation links and sign-out controls.

### Requirement: Active Business Context Display
The dashboard shell SHALL visibly display the currently selected business information.

#### Scenario: Display Active Business Identity
- **WHEN** the dashboard shell renders
- **THEN** it displays the current business name, category/industry badge, and default currency indicator prominently at the top of the sidebar or mobile header.

### Requirement: Section Navigation
The shell SHALL provide navigation items to all core operational areas of the POS system.

#### Scenario: Active Section Highlighting
- **WHEN** the user navigates to `/dashboard` or any sub-route (`/dashboard/inventory`, `/dashboard/transactions`, `/dashboard/cash`, `/dashboard/reports`, `/dashboard/settings`)
- **THEN** the shell highlights the active route corresponding to the current section and renders its respective page content inside the main viewport.
