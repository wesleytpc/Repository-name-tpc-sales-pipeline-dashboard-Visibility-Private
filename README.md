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
