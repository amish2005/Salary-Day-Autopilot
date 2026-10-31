# Salary Day Autopilot

> **Your salary. Your bills. Your month. On autopilot.**

Salary Day Autopilot is an intelligent fintech SaaS platform designed for early-career salaried professionals (like Arjun, a 24-year-old IT employee in Chennai earning ₹45,000/month) who run out of money before the end of the month. Instead of complex charts or generic budgeting spreadsheets, it answers two fundamental questions within 10 seconds:
1. **Am I financially okay this month?**
2. **What should I do next?**

---

## 🌟 Key Features

1. **Deterministic Financial Calculation Engine (`lib/finance/`)**:
   - Zero AI hallucinations for monetary calculations.
   - Safe integer-paise representation internally to prevent floating-point inaccuracies.
   - Formats numbers in standard Indian Rupee currency format (e.g. ₹45,000, ₹1,20,000).

2. **Virtual Money Envelopes (Priority Allocation)**:
   - Allocates incoming funds according to a strict priority hierarchy:
     1. Rent (Critical)
     2. Bike EMI (Critical)
     3. Other critical obligations
     4. Family support
     5. Utilities & Internet
     6. Essential groceries & commute
     7. Credit card liability reserves
     8. Annual bill reserves (e.g. Bike insurance in February)
     9. Savings goals (e.g. New Laptop before April)
     10. Flexible / Discretionary daily spend
   - Never implies actual bank transfers; allocations are virtual budget reserves.

3. **Mandatory Hackathon Edge Cases Handled**:
   - **Case 1: Salary arrives ₹8,000 short (₹37,000 vs ₹45,000)**: Automatically rebalances budget, reduces flexible spending and pauses optional savings while 100% protecting Rent and Bike EMI. Generates human-readable traceable explanations.
   - **Case 2: Bill due on 31st in February**: Date utility clamps 31st to 28th (or 29th in leap years) without altering original recurring model data, duplicating bills, or crashing.
   - **Case 3: Unexpected expense exceeds available money (e.g., ₹12,000 hospital emergency vs ₹3,000 flexible money)**: Calculates exact ₹9,000 shortfall, provides loud warnings before touching protected reserves, and requires explicit user confirmation.
   - **Weekend & Holiday Salary Shift**: If the salary date (7th) falls on a weekend or public holiday, arrival is automatically shifted forward to the next business day.
   - **Roommate Contribution Tracker**: Expected income (₹3,000 on the 15th) is strictly excluded from available spend until marked as confirmed/received.
   - **Credit Card Liability Tracking**: Purchases create card liabilities rather than direct bank cash outflows; settling the bill reduces bank balance and clears the liability without double counting.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Language**: TypeScript (Strict typing, integer paise math)
- **Styling**: Tailwind CSS, Dark navy fintech design system
- **Icons**: Lucide React
- **Database**: Supabase PostgreSQL (SQL migrations + Row Level Security)
- **Authentication**: Clerk Authentication (`@clerk/nextjs`) with seamless demo session fallback
- **Date Utilities**: `date-fns` (Asia/Kolkata timezone safe)
- **Unit Testing**: Vitest (`npm test`)

---

## 📂 Project Structure

```
salary-day-autopilot/
├── app/
│   ├── actions/
│   │   └── finance-actions.ts        # Server actions with session ownership validation
│   ├── activity/page.tsx             # Autopilot audit log & decision history
│   ├── bills/page.tsx                # Recurring bills management & short month handling
│   ├── dashboard/page.tsx            # Main 10-second dashboard
│   ├── my-money/page.tsx             # Income sources, bank balance vs envelopes
│   ├── onboarding/page.tsx           # Quick-start wizard with Arjun demo profile
│   ├── savings/page.tsx              # Laptop savings goal & monthly contributions
│   ├── settings/page.tsx             # Preferences, cycles, CSV export & demo resets
│   ├── spending/page.tsx             # Spending tracker & credit card liabilities
│   ├── sign-in/                      # Sign-in route
│   ├── sign-up/                      # Sign-up route
│   ├── layout.tsx                    # Root layout with dark theme & Clerk provider
│   └── page.tsx                      # Premium fintech SaaS landing page
├── components/
│   ├── layout/                       # Sidebar, Topbar, Mobile navigation, AppShell
│   ├── dashboard/                    # DashboardView, envelopes, next action cards
│   ├── demo/                         # DemoTesterModal (one-click edge case testing)
│   ├── bills/                        # BillsView & Add Bill modal
│   ├── spending/                     # SpendingView & Card settle modal
│   ├── savings/                      # SavingsView & Deposit modal
│   └── settings/                     # SettingsView & CSV exporter
├── lib/
│   ├── auth/                         # Clerk auth helper & demo session resolution
│   ├── db/                           # Supabase PostgreSQL client & data repository
│   └── finance/                      # Deterministic Financial Calculation Engine
│       ├── types.ts                  # Financial entities & integer paise interfaces
│       ├── date-utils.ts             # Rupee formatter, Feb clamp, weekend salary shift
│       ├── salary-calculator.ts      # Salary comparison, shortfall & income breakdown
│       ├── bill-scheduler.ts         # Bill priority schedule & annual amortizations
│       ├── allocation-engine.ts      # Master virtual envelope allocation algorithm
│       ├── emergency-engine.ts       # Unexpected expense & protected reserve analysis
│       ├── credit-card-engine.ts     # Card liabilities & settlement calculations
│       ├── savings-engine.ts         # Goal affordability & monthly targets
│       ├── spending-engine.ts        # Category spend & unusual transaction detection
│       ├── financial-summary.ts      # High-level aggregator answering 10s questions
│       └── __tests__/                # Vitest test suite covering all mandatory cases
└── supabase/
    ├── migrations/                   # PostgreSQL schema migration with RLS
    └── seed.sql                      # Arjun's sample profile seed data
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js >= 20 (Node 22 recommended)
- npm >= 10

### 2. Installation
```bash
git clone <repository-url>
cd "Salary Day Autopilot"
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Clerk and Supabase credentials if available:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```
*(Note: If Supabase or Clerk credentials are not immediately configured, the application automatically runs in demo mode using its built-in server repository and seeds Arjun's profile seamlessly!)*

### 4. Running the Database Migrations
Execute the SQL migration located at `supabase/migrations/20261031_initial_schema.sql` inside the Supabase SQL Editor.
To seed Arjun's profile into Supabase, run `supabase/seed.sql`.

### 5. Run Unit Tests
```bash
npm test
```
All 10 financial engine test suites will execute and verify the edge cases:
- Indian Rupee format validation
- Leap year & February 28/29 clamping for day 31 bills
- Weekend & holiday salary arrival shifts
- Case 1: Salary arriving ₹8,000 short with Rent/EMI protection
- Case 2: Bill due on 31st in February
- Case 3: ₹12,000 emergency expense exceeding flexible money
- Integrity rule: Expected income exclusion until received

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🏆 Hackathon Judge Walkthrough Guide

Use the **floating "Test Edge Cases" beaker button** on the bottom right of any screen to test all hackathon evaluation flows with a single click:

- **DEMO 1: Immediate Onboarding & Arjun's Profile**:
  1. Visit `/onboarding` or click "Start with Arjun's Profile" on the landing page.
  2. The dashboard immediately displays Arjun's financial status:
     - Available to Spend: ₹8,450 (₹384/day)
     - Bank Balance: ₹45,000
     - Protected Reserves: ₹35,400 (Rent ₹15,000, Bike EMI ₹6,000, Money home ₹5,000, etc.)
     - Next Action: "Pay your bike EMI of ₹6,000 by November 5."

- **DEMO 2: Salary Arrives ₹8,000 Short (₹37,000 vs ₹45,000)**:
  1. Click "Test Edge Cases" -> Click "Simulate Shortfall".
  2. The engine recalculates the entire monthly budget:
     - Rent (₹15,000) and Bike EMI (₹6,000) remain 100% funded and protected.
     - Flexible spending is trimmed and optional laptop savings are paused.
     - Traceable explanation generated: *"Your salary was ₹8,000 lower than expected. We reduced your flexible spending by ₹6,000 and paused ₹2,000 of optional laptop savings to protect your rent and EMI."*

- **DEMO 3: Unexpected ₹12,000 Hospital Emergency**:
  1. Click "Test Edge Cases" -> Click "Trigger (Check)" under Case 3.
  2. Autopilot calculates the immediate deficit (₹9,000 against available flexible money).
  3. Displays a loud **Protected Reserve Warning** modal informing the user that proceeding will consume money reserved for essential obligations, requiring explicit confirmation.

- **DEMO 4: Bill Due on 31st in February**:
  1. Click "Test Edge Cases" -> Click "Add 31st Due Bill".
  2. Inspect `/bills`. The schedule engine clamps the effective due date to February 28/29 without altering the recurring day or crashing.

- **DEMO 5: Roommate ₹3,000 Contribution**:
  1. Click "Test Edge Cases" -> Click "Mark Overdue" or "Mark Received".
  2. Overdue income triggers an immediate alert and excludes the ₹3,000 from available spend; marking it received deposits it into the bank balance and rebalances flexible funds.

---

## 📄 License
MIT License. Built for the MedaVida Fintech Hackathon.
