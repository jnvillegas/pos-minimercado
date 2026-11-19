# Spec Delta: user-auth

## Purpose
Provides user authentication management via Supabase Auth, enabling email and password registration, login, session persistence across Server and Client Components, and secure sign-out.

## ADDED Requirements

### Requirement: User Registration
The system SHALL provide a registration interface allowing new users to create an account with their email and password.

#### Scenario: Successful Registration
- **WHEN** a guest submits valid email and password credentials on `/register`
- **THEN** a new Supabase auth user is created, a session cookie is established, and the user is redirected to `/onboarding`.

#### Scenario: Registration with Existing Email
- **WHEN** a guest submits an email address that is already registered
- **THEN** the registration fails and a user-friendly error message is displayed without creating duplicate credentials.

### Requirement: User Authentication (Login)
The system SHALL authenticate registered users using email and password credentials.

#### Scenario: Successful Login with No Business Membership
- **WHEN** an existing user submits valid credentials on `/login` and possesses no business memberships
- **THEN** the user session is authenticated and redirected to `/onboarding`.

#### Scenario: Successful Login with Active Business Membership
- **WHEN** an existing user submits valid credentials on `/login` and belongs to at least one business
- **THEN** the user session is authenticated and redirected to `/dashboard`.

#### Scenario: Login with Invalid Credentials
- **WHEN** a user enters an incorrect email or password
- **THEN** the system rejects authentication and renders a descriptive error message on `/login`.

### Requirement: User Sign Out
The system SHALL invalidate active user sessions on demand.

#### Scenario: Explicit Sign Out
- **WHEN** an authenticated user triggers the sign-out action from the dashboard
- **THEN** the active Supabase session is cleared, session cookies are revoked, and the user is redirected to `/login`.
