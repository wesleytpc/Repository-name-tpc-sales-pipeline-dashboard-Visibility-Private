# TPC Sales Pipeline Dashboard

A sales pipeline dashboard for tracking opportunities, defining wins, measuring pipeline movement and reporting sales performance.

The dashboard is built around a clear management definition:

**Activity is not the final win. Pipeline movement is progress. Money in the bank is the final win.**

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Recharts
- Papa Parse
- lucide-react icons

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root.

3. Add your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/tpc_sales_pipeline"
```

For Supabase or hosted Postgres, use the pooled or direct connection string supplied by the provider. Make sure the database allows Prisma migrations from your machine.

4. Run the Prisma migration:

```bash
npx prisma migrate dev --name init
```

5. Seed the database:

```bash
npx prisma db seed
```

6. Start the development server:

```bash
npm run dev
```

Open the local URL shown in the terminal and go to `/dashboard`.

## Local and Live Environments

Use separate environment files so local development and Supabase live data do not get mixed up.

Local development:

```text
.env.local
```

This should point to your local Postgres database:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pipeline_dev"
```

Live production:

```text
.env.production
```

This should point to Supabase:

```env
DATABASE_URL="postgresql://postgres.ptevjbhccfwqwlszmstk:YOURPASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

Replace `YOURPASSWORD` and the live login placeholders inside `.env.production`. Do not commit or share real passwords.

Use these commands when changing the database schema:

```bash
npm run db:push:local
npm run db:generate:local
```

For Supabase/live:

```bash
npm run db:push:prod
npm run db:generate:prod
```

## Useful Commands

```bash
npm install prisma @prisma/client recharts papaparse lucide-react
npm install -D tsx @types/papaparse
npx prisma init
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

## CSV Import Columns

```csv
companyName,contactName,email,phone,industry,product,opportunityType,stage,estimatedValue,probability,expectedCloseDate,nextStep,nextStepDate,lastContactDate,status,notes
```

Only `companyName` is required. Missing or invalid stages default to `LEAD_IDENTIFIED`; missing probabilities are calculated from the stage.

## Meeting Summaries and Customer Notes

Each opportunity profile includes a meeting notes section. Use it to save:

- Meeting date and title
- Attendees
- Meeting summary
- Customer notes
- Next actions
- Transcript text
- Recording link

Adding a meeting note also logs a meeting activity, updates the opportunity's last contact date and, where appropriate, moves early-stage active opportunities to `MEETING_HELD`.

After pulling this schema change into an existing database, run:

```bash
npx prisma migrate dev --name add_meeting_notes
npx prisma generate
```

## Opportunity Types and Incoming Payments

Opportunity Type is a dropdown on the add/edit opportunity form, with an `Other` option for custom deal types.

Each opportunity profile also includes an Incoming Payments section for tracking actual funds received before, during or after the deal. Payment types include:

- Deposit
- Development milestone
- Subscription
- Retainer
- Final payment
- Part payment
- Other

Use this to capture money coming in even when the full opportunity has not yet reached the final `PAYMENT_RECEIVED` stage.

After pulling the payment records schema change into an existing database, run:

```bash
npx prisma migrate dev --name add_payment_records
npx prisma generate
```

## PDF Reports

The Reports page includes an `Export PDF` button. It downloads a management summary PDF with executive metrics, progress wins, final wins, follow-up risks and the suggested management summary text.

## Finance and Commission Profiles

The Finance page includes starter commission profiles for:

- Wesley
- Helena

The Finance page is protected by a 4-digit PIN. Add this to your `.env` file and change the PIN to your own number:

```env
FINANCE_PIN="4714"
FINANCE_PIN_SECRET="change-this-finance-cookie-secret"
```

Commission rates are set to 0% until the confirmed contract structure is available. After pulling this schema change into an existing database, run:

```bash
npx prisma migrate dev --name add_commission_salespeople
npx prisma generate
```

## Login Access

The dashboard uses a simple branded login page and a `Log Out` button in the header.

Single-login setup:

```env
BASIC_AUTH_USER="wesley"
BASIC_AUTH_PASSWORD="change-this-password"
AUTH_SESSION_SECRET="change-this-login-cookie-secret"
```

Multiple-login setup:

```env
BASIC_AUTH_USERS="wesley:owner-password,manager:manager-password,guest:guest-password"
AUTH_SESSION_SECRET="change-this-login-cookie-secret"
```

Use `BASIC_AUTH_USERS` when you want two or three people to access the dashboard. This is still simple shared dashboard protection, not full role-based user accounts. The Finance page keeps its separate 4-digit PIN.

## Hidden Personal Slips Dashboard

The app includes a hidden personal slips area at:

```text
/slips
```

It is not shown in the main business navigation. It has its own PIN:

```env
SLIPS_PIN="4714"
SLIPS_PIN_SECRET="change-this-slips-cookie-secret"
```

Use ChatGPT to extract receipt photos into CSV or JSON, then paste the structured output into `/slips`.

Recommended CSV format:

```csv
date,merchant,category,paymentMethod,totalAmount,vatAmount,notes,items
2026-05-31,Checkers,GROCERIES,CARD,842.50,109.89,Monthly groceries,"Milk; Bread; Chicken"
```

After pulling this schema change into an existing database, run:

```bash
npx prisma migrate dev --name add_personal_slips
npx prisma generate
```
