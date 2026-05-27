# Deployment Guide

This app is intended to run as a personal online dashboard using:

- GitHub for source control
- Vercel for the Next.js app
- Supabase for PostgreSQL

## 1. Supabase

Create a Supabase project and copy the PostgreSQL connection string.

Use the pooled connection string for Vercel if Supabase provides one. It normally looks like:

```env
DATABASE_URL="postgresql://postgres.xxxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

Keep this value private. Do not commit it to GitHub.

## 2. GitHub

Create a private GitHub repository for this project.

From this folder:

```bash
git init
git add .
git commit -m "Initial pipeline dashboard"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## 3. Vercel

Import the GitHub repository into Vercel.

Use the default Next.js settings:

```txt
Framework Preset: Next.js
Build Command: npm run build
Install Command: npm install
Output Directory: .next
```

Add this environment variable in Vercel:

```env
DATABASE_URL="your Supabase PostgreSQL connection string"
BASIC_AUTH_USER="your-login-name"
BASIC_AUTH_PASSWORD="a-private-password"
```

The dashboard is protected in production with browser basic authentication. Local development stays open so you can work quickly on your machine.

## 4. Create The Online Database Tables

After `DATABASE_URL` is set to Supabase, run this once from your machine:

```bash
npx prisma db push
```

Optional sample data:

```bash
npm run seed
```

For real personal use, you can skip the seed and import your own CSV in the app.

## Daily Use

Once deployed, use the Vercel URL instead of `localhost`.

To update data, export your Excel sheet as CSV and import it through the app.
