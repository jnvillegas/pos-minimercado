# Spec Delta: cash-reconciliation

## Purpose
Manages cash count verification, cash discrepancy detection (balanced, surplus, shortage), mandatory variance justification, and historical shift audit logging.

## ADDED Requirements

### Requirement: Cash Reconciliation and Shift Closing
The system SHALL provide a modal dialog for counting cash and closing an active cash register shift.

#### Scenario: Balanced Cash Count
- **WHEN** a user enters an actual counted cash amount equal to the expected cash balance
- **THEN** the system SHALL record the shift as `closed`, assign difference `0.00`, record `closed_by` and timestamp, and transition the register status to closed.

#### Scenario: Discrepancy Calculation
- **WHEN** a user enters an actual counted cash amount different from the expected cash balance
- **THEN** the interface SHALL calculate `actual_cash - expected_cash` and display a clear visual tag indicating either a Surplus (`difference > 0`) or Shortage (`difference < 0`).

### Requirement: Mandatory Justification on Variance
The system SHALL require an explanatory note whenever a non-zero cash variance occurs during shift closure.

#### Scenario: Variance Without Note Rejected
- **WHEN** the counted cash difference is non-zero and the user submits the closure form without providing a note
- **THEN** the system SHALL reject the closure and highlight the notes field as mandatory.

#### Scenario: Variance With Explanatory Note Accepted
- **WHEN** the counted cash difference is non-zero and the user provides an explanatory note
- **THEN** the system SHALL accept the closure and store the note for audit purposes.

### Requirement: Shift Audit History
The system SHALL display an audit history table of all previously closed shifts for the active business.

#### Scenario: Render Shift History
- **WHEN** an authorized user navigates to `/dashboard/cash-register`
- **THEN** the system SHALL render a table of past shifts displaying: Open Date, Close Date, Opened By, Closed By, Initial Cash, Expected Cash, Actual Cash, Difference, and Audit Notes.
