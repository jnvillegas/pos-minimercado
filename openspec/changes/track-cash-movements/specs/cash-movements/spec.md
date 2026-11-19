# Spec Delta: cash-movements

## Purpose
Manages manual recording of business expenses and miscellaneous incomes, category classifications, cash shift linkage, and expected drawer balance deductions.

## ADDED Requirements

### Requirement: Record Manual Expense or Income
The system SHALL provide an interface allowing staff to record manual financial outflows (expenses) or inflows with category, concept, amount, and payment method.

#### Scenario: Create Cash Expense Linked to Active Shift
- **WHEN** an authorized user records an expense with payment method Cash while an active cash register shift is open
- **THEN** the system SHALL create a `cash_movements` record linked to the active `shift_id` and deduct the amount from the shift's expected cash.

#### Scenario: Create Expense Without Active Shift
- **WHEN** a user records an expense paid via electronic transfer or while no register shift is open
- **THEN** the system SHALL create the record with `shift_id = null`, preserving the transaction for general ledger accounting without impacting drawer balance.

### Requirement: Cash Shift Expected Balance Deduction
The cash register shift calculation SHALL automatically factor in cash expenses recorded during the shift period.

#### Scenario: Register Shift Reconciliation with Expenses
- **WHEN** a cash shift is inspected or closed after cash expenses have been logged for its `shift_id`
- **THEN** the expected cash formula SHALL compute `Initial Cash + Cash Sales + Cash Incomes - Cash Expenses`.
