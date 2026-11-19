# Spec Delta: team-rbac

## Purpose
Enforces role-based permissions (`owner`, `manager`, `cashier`), staff invitations, navigation visibility, sensitive data masking (hiding wholesale cost prices), and route protection.

## ADDED Requirements

### Requirement: Staff Invitation and Role Assignment
The system SHALL allow business owners to invite team members by email and assign them either `manager` or `cashier` roles.

#### Scenario: Owner Invites Cashier
- **WHEN** an authenticated business owner submits an employee email and selects role `cashier` on `/dashboard/settings/team`
- **THEN** the system SHALL generate a unique invitation record and provide a shareable invitation link.

#### Scenario: Non-Owner Prohibited from Inviting Staff
- **WHEN** a user with role `manager` or `cashier` attempts to access `/dashboard/settings/team` or trigger the invitation Server Action
- **THEN** the system SHALL reject the operation with a 403 Forbidden status.

#### Scenario: Staff Member Accepts Invitation
- **WHEN** an invited user navigates to the invitation acceptance URL while authenticated
- **THEN** the system SHALL execute `accept_invitation` RPC, create the membership in `business_members` with the assigned role, mark the invite as accepted, and redirect to `/dashboard`.

### Requirement: Sensitive Cost Data Masking for Cashiers
The system SHALL omit wholesale cost prices (`cost_price`) and profit margin figures from data returned to cashiers.

#### Scenario: Cashier Views Product Catalog
- **WHEN** a user with role `cashier` views the product catalog on `/dashboard/inventory` or queries product data
- **THEN** the server and client interfaces SHALL omit or redact `cost_price` and profit margin calculations, displaying only stock balance and retail sale prices.

### Requirement: Role-Based Route and Capability Restrictions
The application layer and middleware SHALL enforce strict route and action permissions per user role.

#### Scenario: Cashier Attempts to Access Reports
- **WHEN** an authenticated user holding role `cashier` attempts to navigate to `/dashboard/reports`
- **THEN** the system SHALL intercept the request and redirect the user to `/dashboard/pos` or render an unauthorized access notice.

#### Scenario: Manager Operates Inventory but Blocked from Global Reports
- **WHEN** a user with role `manager` accesses `/dashboard/inventory`
- **THEN** the user SHALL have full access to edit products and view costs, but SHALL be forbidden from accessing `/dashboard/reports` or `/dashboard/settings/team`.
