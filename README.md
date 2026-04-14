# LS Nexus — LifeScientific CRM

A modern, full-stack CRM built for LifeScientific's sales force. LS Nexus connects reps to customers, forecasts, and product data in one place.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **ORM:** Prisma 7
- **Database:** Neon (serverless PostgreSQL)
- **File Storage:** AWS S3
- **Auth:** NextAuth.js v5 (Credentials provider)
- **Charts:** Recharts

## Features

- **Dashboard** — KPI cards, revenue trends, top customers, upcoming action items
- **Customer Management** — Searchable/filterable list with star ratings and revenue; detail page with tabs:
  - **Locations** — All physical customer locations
  - **Contacts** — Primary decision-makers with phone/email
  - **Revenue** — Historical revenue chart and records
  - **Action Items** — Per-customer tasks and follow-ups
  - **Forecasts** — Linked financial forecasts
- **Item Master** — Full product catalog (SKU, name, category, unit price, UOM)
- **Financial Forecasting** — Build forecasts by customer + period with product line items, wholesale/retail % channel split
- **Action Items** — Kanban board (To Do / In Progress / Done) linked to customer accounts
- **S3 File Attachments** — Upload documents to customers and products

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/devlee1980/ls-crm.git
cd ls-crm
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in your credentials in `.env`:

- `DATABASE_URL` — Your Neon PostgreSQL connection string
- `AUTH_SECRET` — Generate with `openssl rand -base64 32`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME` — Your AWS S3 credentials

### 3. Set Up the Database

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

This creates all tables and seeds sample data including:
- **Admin:** `admin@lifescientific.com` / `admin123`
- **Rep:** `rep@lifescientific.com` / `rep123`
- Sample customers, products, revenue records, and action items

### 4. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

## Database Schema

```
User → Customer → CustomerLocation
                → Contact (Decision Makers)
                → ActionItem
                → Forecast → ForecastItem → Product
                → RevenueRecord
                → Attachment (S3)
```

## Deployment

Deploy to Vercel with your Neon DATABASE_URL and the other env vars set in the Vercel project settings. The app works with Vercel's serverless runtime out of the box.

## User Roles

| Role    | Access                                     |
|---------|--------------------------------------------|
| ADMIN   | All customers, forecasts, action items     |
| MANAGER | All customers, forecasts, action items     |
| REP     | Only their assigned customers and records  |
