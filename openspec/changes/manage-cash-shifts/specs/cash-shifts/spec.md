# Spec Delta: cash-shifts

## Purpose
Governs cash shift creation, single-shift invariants per business, starting cash floats, live cash balance monitoring, and shell status indicators.

## ADDED Requirements

### Requirement: Open Cash Shift
The system SHALL allow an authorized staff member to open a new cash register shift by providing an initial cash float.

#### Scenario: Successful Shift Opening
- **WHEN** a user enters a valid non-negative initial cash float for a business with no active shift
- **THEN** the system SHALL create a new `cash_shifts` record with status `open`, recording the `opened_by` user ID and timestamp, and update the UI to active shift state.

#### Scenario: Multiple Open Shifts Prevention
- **WHEN** a user attempts to open a cash shift while another shift is currently marked `open` for the same business
- **THEN** the database constraint and application layer SHALL reject the operation, preventing concurrent open shifts.

### Requirement: Real-Time Shift Balance Monitoring
The system SHALL aggregate and display live cash metrics while a shift remains open.

#### Scenario: Live Balance Aggregation
- **WHEN** an active cash shift is rendered on `/dashboard/cash-register`
- **THEN** the interface SHALL calculate and present: Initial Cash, Cash Sales Total, Digital/Card Sales Total, Cash Expenses Total, and Expected Cash in Drawer.

### Requirement: Global Register Status Indicator
The system SHALL display the current register state prominently across the dashboard navigation shell.

#### Scenario: Open Register Indicator
- **WHEN** an active cash shift exists for the current business
- **THEN** the sidebar and mobile header SHALL render a distinct "Caja Abierta" badge with an active green status indicator.

#### Scenario: Closed Register Indicator
- **WHEN** no cash shift is currently open for the business
- **THEN** the navigation shell SHALL render a "Caja Cerrada" badge with a neutral or alert indicator.
