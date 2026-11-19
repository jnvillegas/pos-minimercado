# Spec Delta: business-tenancy

## Purpose
Manages multi-tenant business provisioning, organization memberships (`owner`, `manager`, `cashier`), onboarding flows, and strict PostgreSQL Row Level Security (RLS) data isolation.

## ADDED Requirements

### Requirement: Business Onboarding
The system SHALL present an onboarding screen (`/onboarding`) to authenticated users without an associated business, requiring business name, category/industry, and default currency.

#### Scenario: Successful Business Creation
- **WHEN** an authenticated user without a business submits valid name, industry, and currency (ARS or USD) on `/onboarding`
- **THEN** the system executes the atomic `create_business_with_owner` database RPC, creates the `businesses` record, creates a `business_members` record with role `owner`, and redirects the user to `/dashboard`.

#### Scenario: Invalid Onboarding Input
- **WHEN** the user submits an empty business name or an unsupported currency
- **THEN** client-side and server-side validations fail, preventing database calls and surfacing actionable error messages.

### Requirement: Multi-Tenant Data Isolation via RLS
The database layer SHALL enforce strict Row Level Security policies preventing unauthorized cross-tenant read or write access.

#### Scenario: Authorized Business Member Read
- **WHEN** an authenticated member of a business queries the `businesses` or `business_members` table for their associated business ID
- **THEN** the database returns the records for which the user holds an active membership.

#### Scenario: Cross-Tenant Access Prevention
- **WHEN** an authenticated user attempts to read, update, or delete a business or membership record belonging to a business they are not a member of
- **THEN** PostgreSQL RLS evaluates the operation as unauthorized, returning empty result sets for queries or raising a policy violation for modifications.

### Requirement: Tenancy Route Protection and Redirection
The Next.js middleware and route handlers SHALL enforce business membership state before allowing access to operational routes.

#### Scenario: Missing Business Redirection
- **WHEN** an authenticated user who is not a member of any business requests `/dashboard` or any sub-route
- **THEN** the request is intercepted and redirected to `/onboarding`.

#### Scenario: Onboarding Redirection for Existing Tenant
- **WHEN** an authenticated user who already belongs to an active business requests `/onboarding`
- **THEN** the request is intercepted and redirected to `/dashboard`.
