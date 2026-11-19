# Spec Delta: pos-terminal

## Purpose
Provides the high-speed Point of Sale cashier interface, supporting USB barcode gun inputs, camera barcode decoding, instant catalog search, cart mutations, and global discounting.

## ADDED Requirements

### Requirement: USB Barcode Gun Scanning
The system SHALL maintain focus on a dedicated barcode input and process hardware scanner inputs automatically upon receiving the delimiter key.

#### Scenario: Barcode Match Adds Item to Cart
- **WHEN** a USB barcode scanner enters a valid barcode and sends an Enter keystroke
- **THEN** the system SHALL locate the matching product in the active business catalog, append it to the cart (or increment quantity if already present), and reset input focus immediately.

#### Scenario: Barcode Not Found Warning
- **WHEN** a barcode is entered that does not correspond to any active product in the business
- **THEN** the system SHALL emit an audible or visual alert indicating no matching product was found, keeping existing cart contents intact.

### Requirement: Mobile Camera Barcode Scanner
The system SHALL enable mobile device users to scan barcodes using the integrated device camera via `html5-qrcode`.

#### Scenario: Camera Scan Detected
- **WHEN** a user activates the camera scanner and positions a supported 1D/2D barcode within the viewfinder
- **THEN** the system SHALL decode the barcode value, add the associated product to the cart, and offer continuous scanning mode.

### Requirement: Interactive Cart and Global Discounts
The system SHALL provide interactive cart controls allowing cashiers to alter item quantities, remove lines, and apply global order discounts.

#### Scenario: Adjust Item Quantity
- **WHEN** a cashier modifies the quantity stepper or enters a numeric quantity for a cart line item
- **THEN** the line subtotal and overall cart totals SHALL recalculate in real time.

#### Scenario: Apply Percentage or Fixed Discount
- **WHEN** a cashier applies either a percentage discount (e.g., 10%) or a fixed discount amount (e.g., $500)
- **THEN** the cart SHALL recompute the net total amount due without modifying underlying unit prices.
