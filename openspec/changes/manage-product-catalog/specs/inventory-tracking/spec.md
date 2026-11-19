# Spec Delta: inventory-tracking

## Purpose
Monitors real-time inventory balances, calculates inventory valuation at cost, highlights low-stock thresholds, and processes atomic stock adjustments.

## ADDED Requirements

### Requirement: Inventory Valuation and Metric Summaries
The system SHALL aggregate and present key inventory metrics at the top of the `/dashboard/inventory` view.

#### Scenario: Display Metric Cards
- **WHEN** the inventory dashboard is rendered for an active business
- **THEN** the system SHALL calculate and display: total active products count, total inventory valuation (`sum(stock * cost_price)` formatted in the business currency), and total count of products where `stock <= min_stock`.

### Requirement: Low Stock Threshold Detection and Filtering
The system SHALL monitor minimum stock thresholds and provide quick filtering for items requiring replenishment.

#### Scenario: Visual Low Stock Indicator
- **WHEN** a product's current stock quantity is less than or equal to its configured `min_stock` threshold
- **THEN** the product row SHALL display a visual alert badge indicating low stock.

#### Scenario: Filter by Low Stock Only
- **WHEN** the user enables the "Solo stock bajo" quick filter toggle
- **THEN** the product table SHALL filter the view to display exclusively items where `stock <= min_stock`.

### Requirement: Quick Stock Adjustment
The system SHALL provide an atomic mechanism to adjust product stock levels without opening the full product edit interface.

#### Scenario: Goods Receipt Stock Addition
- **WHEN** a user enters a positive adjustment quantity and confirms stock arrival
- **THEN** the system SHALL execute an atomic database adjustment, incrementing the product stock by the specified quantity.

#### Scenario: Shrinkage or Loss Stock Reduction
- **WHEN** a user enters a negative adjustment for damaged goods or shrinkage
- **THEN** the system SHALL decrement the product stock, ensuring the balance does not violate non-negative stock constraints.
