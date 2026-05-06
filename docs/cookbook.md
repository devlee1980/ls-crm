# LS Nexus cookbook

Step-by-step recipes for the most common changes in this codebase. Each recipe shows the minimum code that compiles and runs, then points at a real reference implementation in the repo if you want a richer example.

If you're new here, read [engineering-onboarding.md](./engineering-onboarding.md) first — it explains the routing model, auth flow, and conventions that these recipes assume.

## Recipes

- [Add a new page under (dashboard)](#add-a-new-page-under-dashboard)
- [Add a new API route](#add-a-new-api-route)
- [Add a new Prisma model + migration](#add-a-new-prisma-model--migration)
- [Upload/download a file via S3](#uploaddownload-a-file-via-s3)
- [Send a transactional email](#send-a-transactional-email)
- [Add a cron job](#add-a-cron-job)
- [Add a Server Action](#add-a-server-action)
- [Add an authenticated client form](#add-an-authenticated-client-form)
- [Add a sidebar nav entry](#add-a-sidebar-nav-entry)
- [Restrict a route or query to ADMIN/MANAGER](#restrict-a-route-or-query-to-adminmanager)

---

## Add a new page under (dashboard)

Pages under [src/app/(dashboard)/](../src/app/(dashboard)/) are protected by [src/proxy.ts](../src/proxy.ts) and wrapped by the dashboard layout (sidebar, session provider, page-view tracker).

```tsx
// src/app/(dashboard)/widgets/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { WidgetsTable } from "@/components/widgets/WidgetsTable";

export default async function WidgetsPage() {
  const session = await auth();
  const widgets = await prisma.widget.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <Header title="Widgets" />
      <WidgetsTable widgets={widgets} role={session!.user!.role} />
    </>
  );
}
```

Don't forget to add a sidebar nav entry — see [Add a sidebar nav entry](#add-a-sidebar-nav-entry).

Reference: [src/app/(dashboard)/customers/page.tsx](../src/app/(dashboard)/customers/page.tsx).

---

## Add a new API route

Use a route handler when the operation is called via `fetch` from a client component or by an external system.

```ts
// src/app/api/widgets/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const widgetSchema = z.object({
  name: z.string().min(1).max(120),
  size: z.number().int().positive(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const widgets = await prisma.widget.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(widgets);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = widgetSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const widget = await prisma.widget.create({ data: parsed.data });
  return NextResponse.json(widget, { status: 201 });
}
```

For a per-row endpoint, create `src/app/api/widgets/[id]/route.ts` with `GET`, `PATCH`, `DELETE` handlers. Reference: [src/app/api/customers/route.ts](../src/app/api/customers/route.ts) and [src/app/api/customers/[id]/route.ts](../src/app/api/customers/[id]/route.ts).

---

## Add a new Prisma model + migration

1. Edit [prisma/schema.prisma](../prisma/schema.prisma):

   ```prisma
   model Widget {
     id        String   @id @default(cuid())
     name      String
     size      Int
     createdAt DateTime @default(now())

     @@map("widgets")
   }
   ```

   The `@@map` line keeps your DB tables snake_cased while letting Prisma client use PascalCase model names — that's the convention across the rest of the schema.

2. Generate and apply the migration locally:

   ```bash
   npx prisma migrate dev --name add_widget
   ```

3. Commit both [prisma/schema.prisma](../prisma/schema.prisma) and the new `prisma/migrations/<timestamp>_add_widget/` folder.

4. Before merging the PR, apply the migration to production. Vercel does **not** run `prisma migrate deploy` automatically:

   ```bash
   DATABASE_URL=<prod-pooled-url> npx prisma migrate deploy
   ```

5. The Vercel build runs `pnpm install` (which runs `prisma generate` via the postinstall hook in [package.json](../package.json) line 8) and then `next build`.

Backwards-incompatible changes (column drops, type narrowing, required-without-default) need extra care — split into two PRs:
- PR 1: add the new column nullable / with default, deploy.
- PR 2: backfill data, mark the column required, drop the old one.

---

## Upload/download a file via S3

Use the helpers in [src/lib/s3.ts](../src/lib/s3.ts) — never construct an `S3Client` directly.

```ts
import { uploadToS3, getPresignedUrl, deleteFromS3 } from "@/lib/s3";

// In an API route handling a multipart upload
const formData = await req.formData();
const file = formData.get("file") as File;
const buffer = Buffer.from(await file.arrayBuffer());
const key = `attachments/${customerId}/${Date.now()}-${file.name}`;

await uploadToS3(key, buffer, file.type);

// Persist `key` (NOT the public S3 URL) on the Attachment row.
await prisma.attachment.create({
  data: { customerId, key, filename: file.name, contentType: file.type },
});

// Later, to serve the file back to the browser:
const downloadUrl = await getPresignedUrl(key, 3600); // 1 hour
```

Why store the key, not the URL: the bucket is private, so the URL is a presigned URL with a short TTL. Re-sign on every fetch.

Bucket name comes from `AWS_S3_BUCKET_NAME` (default `ls-nexus-crm`). Reference: [src/app/api/upload/route.ts](../src/app/api/upload/route.ts) and [src/app/api/attachments/](../src/app/api/attachments/).

---

## Send a transactional email

```ts
import { sendEmail, getManagerEmails } from "@/lib/resend";
import { actionItemsDigestEmail } from "@/lib/email-templates";

await sendEmail({
  from: "LS Nexus <noreply@ls-nexus.com>",
  to: await getManagerEmails(),
  subject: "Weekly action items digest",
  html: actionItemsDigestEmail(items),
});
```

Two safety behaviours of `sendEmail` (in [src/lib/resend.ts](../src/lib/resend.ts)):

- If `RESEND_API_KEY` is unset (typical local dev), it logs a warning and returns — no email is sent.
- If `to` is empty, it logs a warning and returns — no Resend call is made.

Both prevent surprises during development. The trade-off is silent failure in prod if the env var is misconfigured; see the troubleshooting table in [engineering-onboarding.md §9.4](./engineering-onboarding.md#94-where-to-look-first-when-something-breaks).

Templates live in [src/lib/email-templates.ts](../src/lib/email-templates.ts). Add new ones there as plain HTML strings (or template literals).

The `from` domain (`ls-nexus.com`) must be verified in the Resend dashboard. Use `noreply@ls-nexus.com` for system emails and `support@ls-nexus.com` for user-replyable ones.

---

## Add a cron job

Cron jobs are scheduled by Vercel and invoke a route handler under [src/app/api/cron/](../src/app/api/cron/) with an `Authorization: Bearer $CRON_SECRET` header.

1. Create the route handler:

   ```ts
   // src/app/api/cron/your-job/route.ts
   import { NextResponse } from "next/server";
   import { prisma } from "@/lib/prisma";

   export async function GET(req: Request) {
     if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }

     // ... your work here
     return NextResponse.json({ ok: true });
   }
   ```

   The `CRON_SECRET` check is non-negotiable — `/api/cron/*` is reachable from the public internet.

2. Add an entry to [vercel.json](../vercel.json) with a cron expression (UTC):

   ```json
   {
     "crons": [
       { "path": "/api/cron/your-job", "schedule": "0 8 * * 1" }
     ]
   }
   ```

   `0 8 * * 1` = 08:00 UTC every Monday. Pick something off-hours for the user base.

3. To test locally:

   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/your-job
   ```

Reference: [src/app/api/cron/action-items-digest/route.ts](../src/app/api/cron/action-items-digest/route.ts).

---

## Add a Server Action

Use a Server Action when the call originates from a Server Component or directly from a `<form action={fn}>` and there's no need for an external URL or third-party caller.

```tsx
// src/app/(dashboard)/widgets/actions.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createWidgetSchema = z.object({
  name: z.string().min(1).max(120),
  size: z.coerce.number().int().positive(),
});

export async function createWidget(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const parsed = createWidgetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid input");

  await prisma.widget.create({ data: parsed.data });
  revalidatePath("/widgets");
}
```

Wire it directly to a form in a Server Component:

```tsx
import { createWidget } from "./actions";

export default function NewWidgetPage() {
  return (
    <form action={createWidget}>
      <input name="name" required />
      <input name="size" type="number" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

Most CRUD in this repo currently uses API routes (because the table/form components were written before Server Actions stabilised). New code can use either; pick the simpler one for the use case.

---

## Add an authenticated client form

The standard form stack is `react-hook-form` + `@hookform/resolvers/zod` + a shared zod schema, posting to an API route.

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const widgetFormSchema = z.object({
  name: z.string().min(1).max(120),
  size: z.coerce.number().int().positive(),
});

type WidgetFormValues = z.infer<typeof widgetFormSchema>;

export function WidgetForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<WidgetFormValues>({ resolver: zodResolver(widgetFormSchema) });

  async function onSubmit(values: WidgetFormValues) {
    const res = await fetch("/api/widgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error("Failed to save widget");
      return;
    }
    toast.success("Widget saved");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="size">Size</Label>
        <Input id="size" type="number" {...register("size")} />
        {errors.size && <p className="text-sm text-destructive">{errors.size.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>Save</Button>
    </form>
  );
}
```

Reuse the same `widgetFormSchema` (or a stricter superset) on the server in the matching route handler — that's the contract that keeps client and server validation aligned.

Reference: [src/components/users/UserForm.tsx](../src/components/users/UserForm.tsx) paired with [src/app/api/users/route.ts](../src/app/api/users/route.ts).

---

## Add a sidebar nav entry

The sidebar is rendered by [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx). Each nav item is a small object with an icon (from `lucide-react`), label, href, and optional role gate.

Add your entry to the nav list in that file:

```tsx
import { Box } from "lucide-react";

const navItems = [
  // ...
  { label: "Widgets", href: "/widgets", icon: Box, roles: ["ADMIN", "MANAGER", "REP"] },
];
```

If a route is admin-only, set `roles: ["ADMIN"]` and the sidebar will hide it from non-admins. The route handler / page itself must still enforce the same restriction server-side — see the next recipe.

---

## Restrict a route or query to ADMIN/MANAGER

The sidebar hiding above is a UX hint, not security. Always re-check on the server.

In an API route or Server Component:

```ts
const session = await auth();
const role = (session?.user as { role?: string })?.role ?? "REP";

if (role !== "ADMIN" && role !== "MANAGER") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

For per-rep data scoping, combine the role check with the rep filter you'll see throughout the codebase:

```ts
const customers = await prisma.customer.findMany({
  where: {
    ...getDivisionFilter(role, division),
    ...(role === "REP" ? { assignedRepId: userId } : {}),
  },
});
```

`getDivisionFilter` is defined in [src/lib/division.ts](../src/lib/division.ts). The pattern lives in [src/app/api/customers/route.ts](../src/app/api/customers/route.ts) (the canonical reference).

For pipeline-deal-specific access logic (which is more nuanced than the standard rep filter), use the helpers in [src/lib/pipeline-deal-access.ts](../src/lib/pipeline-deal-access.ts).

---

## See also

- [engineering-onboarding.md](./engineering-onboarding.md) — overall codebase tour, conventions, deployment, runbooks.
- [README.md](../README.md) — top-level project readme + MFA operations.
- [.env.example](../.env.example) — env var template.
