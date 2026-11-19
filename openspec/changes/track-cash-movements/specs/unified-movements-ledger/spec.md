# Spec Delta: unified-movements-ledger

## Purpose
Provides a consolidated daily ledger view uniting automated POS sales and manual cash movements with period filtering, financial KPIs, and detailed transaction inspection.

## ADDED Requirements

### Requirement: Unified Chronological Ledger
The system SHALL present a consolidated, chronological activity table combining POS sales (`sales`) and manual transactions (`cash_movements`).

#### Scenario: Render Combined Transactions
- **WHEN** an authorized user navigates to `/dashboard/movements`
- **THEN** the system SHALL display both sales and expenses sorted in reverse chronological order, formatting income in positive green values and expenses in negative red values.

#### Scenario: View Transaction Details
- **WHEN** a user clicks on a transaction row in the ledger
- **THEN** the system SHALL open a detail drawer or modal displaying full line-item details for POS sales or category and notes for manual movements.

### Requirement: Financial KPI Cards
The system SHALL calculate and display three headline financial metrics reflecting the selected filter scope.

#### Scenario: Display Financial Summary
- **WHEN** the movements dashboard is loaded for a selected period
- **THEN** the system SHALL calculate and display: Total Incomes (sales + manual income), Total Expenses, and Net Balance (`Incomes - Expenses`).

### Requirement: Ledger Filtering and Preset Scopes
The system SHALL provide filter controls allowing users to narrow ledger records by date, type, payment method, and concept search.

#### Scenario: Filter by Date Presets
- **WHEN** a user selects a preset filter (`Hoy`, `Esta semana`, `Este mes`, or `Personalizado`)
- **THEN** the ledger table and KPI metric cards SHALL immediately update to reflect only transactions falling within the specified date boundaries.

#### Scenario: Filter by Movement Type Tabs
- **WHEN** a user switches between `Resumen`, `Ingresos`, and `Gastos` tabs
- **THEN** the table SHALL filter rows according to the selected movement type without resetting date parameters.
