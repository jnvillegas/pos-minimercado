# Spec Delta: catalog-bulk-import

## Purpose
Enables bulk catalog onboarding through spreadsheet parsing (Excel and CSV via `xlsx`), pre-import data validation with interactive error highlighting, and transactional batch upserting.

## ADDED Requirements

### Requirement: Spreadsheet Parsing and Template Download
The system SHALL provide a downloadable template and parse uploaded Excel (.xlsx, .xls) and CSV files directly within the client browser.

#### Scenario: Download Standardized Template
- **WHEN** a user clicks "Descargar plantilla"
- **THEN** the system SHALL generate and trigger download of an Excel spreadsheet with predefined headers (`Nombre`, `Código de barras`, `Categoría`, `Precio de costo`, `Precio de venta`, `Stock`, `Stock mínimo`).

#### Scenario: Parse Uploaded Spreadsheet
- **WHEN** a user drops or selects an Excel or CSV file
- **THEN** the client-side parser SHALL read all rows and map columns to internal product attributes.

### Requirement: Pre-Import Validation and Interactive Preview
The system SHALL validate parsed rows prior to database persistence and highlight invalid rows to the user.

#### Scenario: Validate Rows and Highlight Errors
- **WHEN** an uploaded spreadsheet contains rows missing mandatory fields (e.g., product name or non-numeric prices)
- **THEN** the preview modal SHALL display the complete dataset, flag invalid rows with specific error messages, and disable confirmation until errors are resolved or omitted.

#### Scenario: Preview Summary Calculation
- **WHEN** spreadsheet rows are validated
- **THEN** the interface SHALL display a real-time counter showing valid rows count and flagged errors count.

### Requirement: Batch Upsert and Automatic Category Creation
The system SHALL persist validated product batches and automatically provision new categories referenced in the spreadsheet.

#### Scenario: Execute Batch Upsert
- **WHEN** a user confirms the import of validated product rows
- **THEN** the system SHALL create any non-existent categories within the active business, upsert products matching on barcode or name, and display a completion summary.
