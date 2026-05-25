# WePay — Salary-Backed Lending Platform for Zambia

> Drawing your needs closer to your Salary.

WePay is a production-ready fintech web application built with Next.js 14 (App Router), TypeScript, PostgreSQL, Prisma, Tailwind CSS, and NextAuth.js.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | NextAuth.js (Credentials) |
| Validation | Zod + React Hook Form |
| Icons | Lucide React |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your database URL and NextAuth secret:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/wepay_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key"
```

### 3. Set up the database

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/page.tsx        # Login
│   ├── register/page.tsx     # Multi-step registration
│   ├── dashboard/
│   │   ├── layout.tsx        # Dashboard layout (sidebar)
│   │   ├── page.tsx          # Dashboard home
│   │   ├── loans/page.tsx    # Loan management
│   │   ├── loans/apply/      # Loan application
│   │   ├── profile/          # User profile
│   │   └── transactions/     # Transaction history
│   └── api/
│       ├── auth/             # NextAuth + register
│       ├── loans/            # Loan CRUD
│       ├── transactions/     # Transaction history
│       └── user/profile/     # User profile
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── layout/               # Navbar, Footer
│   ├── landing/              # Hero, Features, HowItWorks, Testimonials
│   └── dashboard/            # Sidebar, BalanceCard, LoanCard, etc.
├── lib/
│   ├── prisma.ts             # Prisma client singleton
│   ├── auth.ts               # NextAuth config
│   └── utils.ts              # Helpers (formatCurrency, etc.)
└── types/index.ts            # TypeScript types
```

---

## Features

### Public
- **Landing page** — Hero, Features, How It Works, Testimonials, CTA
- **Login** — Email/password with NextAuth
- **Registration** — 3-step form (Personal → Employment → Password)

### Dashboard (Authenticated)
- **Overview** — Balance card, quick actions, active loan, recent transactions
- **Loans** — View all loans, repayment schedules, progress tracking
- **Apply** — Loan amount slider, term selector, live repayment calculator
- **Profile** — Personal info, employment details, NAPSA status, TransUnion credit badge
- **Transactions** — Full history with type filters and summary stats

---

## Database Models

- `User` — Core user account
- `EmploymentProfile` — Employer, NAPSA number, salary, verification status
- `CreditProfile` — TransUnion score and status
- `Loan` — Loan applications with status tracking
- `LoanRepayment` — Individual repayment schedule entries
- `Transaction` — Financial transaction ledger

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push Prisma schema to DB
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio
```

---

## License

MIT © WePay Financial Services Ltd.
