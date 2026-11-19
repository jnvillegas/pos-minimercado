# Spec Delta: product-catalog

## Purpose
Manages category and product entities, pricing rules, profit margin computations, image asset uploads, and multi-tenant catalog CRUD operations.

## ADDED Requirements

### Requirement: Category Management
The system SHALL allow authorized users (owners and managers) to organize products into custom categories scoped to their active business.

#### Scenario: Create New Category
- **WHEN** an authorized business member submits a unique category name for the active business
- **THEN** a new category record is created and made immediately available for product categorization.

#### Scenario: Duplicate Category Prevention
- **WHEN** a user attempts to create a category whose name already exists within the same business
- **THEN** the system rejects the operation and displays a validation error indicating the category already exists.

### Requirement: Product Creation and Modification
The system SHALL provide a modal or drawer interface allowing users to create and edit products with barcode, name, category, cost price, sale price, and status.

#### Scenario: Create Product with Cost and Sale Pricing
- **WHEN** a user provides a product name, cost price, sale price, and valid stock quantities
- **THEN** the system computes the profit margin percentage and persists the product associated with the active business.

#### Scenario: Product Margin Calculation
- **WHEN** a user modifies either the cost price or sale price in the product form
- **THEN** the interface SHALL calculate and display the real-time gross margin percentage using `((sale_price - cost_price) / sale_price) * 100`.

### Requirement: Product Image Asset Management
The system SHALL support uploading, displaying, and removing product photographs stored in Supabase Storage.

#### Scenario: Successful Image Upload
- **WHEN** a user selects an image file (PNG, JPG, WebP) within the product form
- **THEN** the file is uploaded to the `product-images` storage bucket under the business path prefix, and its public URL is linked to the product.

#### Scenario: Unauthorized Image Deletion
- **WHEN** a user belonging to another business attempts to delete or overwrite an existing product image
- **THEN** the storage security policy SHALL reject the operation.

### Requirement: Multi-Tenant Catalog Data Isolation
The database layer SHALL enforce Row Level Security policies ensuring that category and product records are accessible only to authenticated members of the owning business.

#### Scenario: Cross-Tenant Product Query Prevention
- **WHEN** an authenticated user attempts to query products belonging to a foreign `business_id`
- **THEN** the database RLS policies SHALL return zero rows.
