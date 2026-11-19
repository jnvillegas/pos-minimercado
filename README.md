# POS Minimercado & Retail Management

A full-stack, multi-tenant Point of Sale (POS) and inventory management system designed for retail stores, minimarkets, and local shops. Built with Next.js 16 (App Router, Turbopack, React 19), Tailwind CSS, and Supabase (PostgreSQL with strict Row Level Security).

## Key Features

- **Fast POS Checkout**: Optimized for barcode scanners, live cart calculations, multi-payment support (cash, card, transfer), change calculation, and receipt ticket generation.
- **Inventory & Stock Management**: Product catalog with barcode resolution, gross margin (%) and markup calculation, minimum stock alerts, and bulk Excel (`.xlsx`) import/export.
- **Cash Register & Shifts (Caja y Turnos)**: Opening float management, real-time theoretical cash tracking, blind drawer reconciliation upon closing with mandatory discrepancy justifications, and audit logs.
- **Daily Ledger & Cash Movements**: Real-time cash inflows and outflows, supplier payout recording, and direct deduction from the active shift cash drawer.
- **Financial Analytics & Reports**: Gross revenue, COGS, net profit, margin %, peak shopping hours distribution, payment methods share, and Top 10 best-selling products with multi-sheet Excel export.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `owner`, `manager`, and `cashier` with server-side masking of cost prices and confidential metrics.

## Tech Stack

- **Framework**: Next.js 16.4 (App Router, Turbopack, Partial Prerendering / Cache Components)
- **UI & Styling**: React 19, Tailwind CSS, Lucide Icons, Recharts
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, RPCs, Storage)
- **Validation**: Zod
- **Spreadsheets**: SheetJS (`xlsx`)

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local Supabase stack) or a Supabase Cloud account

### Environment Variables

Copy `.env.example` to `.env.local` and set your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start local Supabase (optional):
   ```bash
   npx supabase start
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.
