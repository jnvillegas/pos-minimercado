# Spec Delta: business-analytics-reports

## Purpose
Provides business intelligence analytics for store owners, calculating revenue, COGS, gross profits, sales trends, peak shopping hours, top-selling products, and Excel report exports.

## ADDED Requirements

### Requirement: Executive Profitability KPIs
The system SHALL aggregate and present core profitability metrics for the selected time range on `/dashboard/reports`.

#### Scenario: Display Headline Financial Metrics
- **WHEN** an authenticated business owner selects a reporting time period
- **THEN** the system SHALL compute and display: Gross Revenue (`sum(total_amount)`), Cost of Goods Sold (`sum(quantity * unit_cost)`), Estimated Gross Profit (`Revenue - COGS`), Gross Profit Margin (`(Gross Profit / Revenue) * 100`), Average Order Value (`Revenue / Sales Count`), and Total Sales Count.

### Requirement: Graphical Sales and Payment Method Distributions
The system SHALL render interactive charts illustrating temporal sales volume and payment method distribution using Recharts.

#### Scenario: Render Temporal Revenue Chart
- **WHEN** the reports dashboard is rendered for a multi-day period
- **THEN** the system SHALL display an interactive line or area chart depicting daily revenue fluctuations over the interval.

#### Scenario: Render Peak Hours Distribution
- **WHEN** an owner reviews hourly sales distribution
- **THEN** the system SHALL display a bar chart illustrating sales volume by hour of day (8:00 to 23:00) to identify peak operational hours.

#### Scenario: Render Payment Method Breakdown
- **WHEN** the reports dashboard is loaded
- **THEN** the interface SHALL render a donut chart detailing the percentage and nominal breakdown across payment methods (Cash, Transfer, Debit Card, Credit Card).

### Requirement: Top Best-Selling Products Ranking
The system SHALL calculate and present a ranking of the top 10 performing products within the selected period.

#### Scenario: Display Top 10 Products Table
- **WHEN** the owner inspects the product performance section
- **THEN** the system SHALL display the top 10 products, allowing sorting by total units sold or by total gross profit generated.

### Requirement: Spreadsheet Report Export
The system SHALL generate a downloadable Excel (.xlsx) workbook summarizing performance for the selected date range.

#### Scenario: Export Report to Excel
- **WHEN** the owner clicks "Exportar Reporte a Excel"
- **THEN** the system SHALL compile and download a formatted spreadsheet containing an Executive Summary sheet, a Top Products sheet, and an itemized Sales Transactions log.
