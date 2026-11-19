# Spec Delta: sale-transaction-processing

## Purpose
Executes atomic sale transactions, enforces active cash register shifts, creates immutable item pricing snapshots, decrements inventory stock balances, and computes cash change due.

## ADDED Requirements

### Requirement: Active Cash Shift Enforcement
The database transaction SHALL verify that an active, open cash register shift exists for the business prior to completing any sale.

#### Scenario: Sale Permitted When Shift Open
- **WHEN** an authorized cashier submits a sale transaction while a cash shift is marked `open` for the business
- **THEN** the sale is assigned to the current `shift_id` and committed successfully.

#### Scenario: Sale Rejected When Shift Closed
- **WHEN** a user attempts to complete a sale while no open cash shift exists for the active business
- **THEN** the database RPC SHALL abort the transaction and raise an exception instructing the user to open the cash register first.

### Requirement: Immutable Item Pricing Snapshots
The system SHALL store frozen snapshots of product attributes (`product_name`, `barcode`, `unit_cost`, `unit_price`) on each sale line item.

#### Scenario: Historical Price Integrity
- **WHEN** a product's price or catalog title is modified after a sale has been recorded
- **THEN** querying past `sale_items` SHALL return the exact price and cost recorded at the moment of the sale without alteration.

### Requirement: Atomic Stock Decrementing
The system SHALL deduct purchased quantities from product inventory balances atomically in the same database transaction.

#### Scenario: Inventory Balance Decrement
- **WHEN** a sale containing tracked catalog products is confirmed
- **THEN** the database transaction SHALL reduce the corresponding `products.stock` by the sold quantity for each item.

### Requirement: Payment Methods and Change Calculation
The system SHALL record the selected payment method and calculate change due for cash payments.

#### Scenario: Cash Transaction with Change Due
- **WHEN** a customer pays in cash with an amount tendered greater than the total sale amount
- **THEN** the system SHALL calculate and record `change_due = amount_tendered - total_amount` and display the change prominently.

#### Scenario: Insufficient Tendered Amount
- **WHEN** a cashier enters an amount tendered less than the total sale amount for a cash payment
- **THEN** the system SHALL reject confirmation until the full amount is tendered.
