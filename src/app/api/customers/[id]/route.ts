import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCustomerAccessWhere } from "@/lib/division";
import { z } from "zod";

function customerAccessContext(session: Session) {
  const userId = session.user?.id ?? "";
  const role = (session.user as { role?: string })?.role ?? "REP";
  const division = (session.user as { division?: string | null })?.division;
  return { userId, role, division };
}
import {
  isBlankAccountNumber,
  normalizeAccountNumber,
  nextSequentialAccountNumber,
} from "@/lib/customer-account-number";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  accountNumber: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  type: z.enum(["DISTRIBUTOR", "RETAILER", "DIRECT", "OTHER"]).optional(),
  wholesalePercent: z.number().min(0).max(100).optional(),
  retailPercent: z.number().min(0).max(100).optional(),
  rating: z.number().min(0).max(5).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PROSPECT"]).optional(),
  notes: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  assignedRepId: z.string().optional().nullable(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { userId, role, division } = customerAccessContext(session);

  const customer = await prisma.customer.findFirst({
    where: { id, ...getCustomerAccessWhere(role, userId, division) },
    include: {
      assignedRep: { select: { id: true, name: true } },
      locations: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      contacts: { orderBy: [{ isPrimary: "desc" }, { lastName: "asc" }] },
      actionItems: {
        include: { assignedTo: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      forecasts: {
        include: { rep: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      revenueRecords: {
        include: { items: { include: { product: { select: { name: true } } } } },
        orderBy: { date: "desc" },
      },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { userId, role, division } = customerAccessContext(session);

  const existingCustomer = await prisma.customer.findFirst({
    where: { id, ...getCustomerAccessWhere(role, userId, division) },
    select: { id: true },
  });
  if (!existingCustomer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = { ...parsed.data };

  const clearedAccount =
    "accountNumber" in parsed.data && isBlankAccountNumber(parsed.data.accountNumber);
  if ("accountNumber" in parsed.data) {
    if (isBlankAccountNumber(parsed.data.accountNumber)) {
      data.accountNumber = await nextSequentialAccountNumber();
    } else {
      data.accountNumber = normalizeAccountNumber(parsed.data.accountNumber);
    }
  }

  const maxAttempts = clearedAccount ? 5 : 1;
  let customer;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      customer = await prisma.customer.update({ where: { id }, data });
      break;
    } catch (e) {
      const dupAccount =
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        Array.isArray(e.meta?.target) &&
        (e.meta.target as string[]).includes("accountNumber");
      if (clearedAccount && dupAccount && attempt < maxAttempts - 1) {
        data.accountNumber = await nextSequentialAccountNumber();
        continue;
      }
      throw e;
    }
  }

  if (!customer) {
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
  return NextResponse.json(customer);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { userId, role, division } = customerAccessContext(session);

  const existingCustomer = await prisma.customer.findFirst({
    where: { id, ...getCustomerAccessWhere(role, userId, division) },
    select: { id: true },
  });
  if (!existingCustomer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await prisma.$transaction([
      // Forecast items → forecasts (required relation, must delete children first)
      prisma.forecastItem.deleteMany({ where: { forecast: { customerId: id } } }),
      prisma.forecast.deleteMany({ where: { customerId: id } }),
      // Revenue items → revenue records (required relation, must delete children first)
      prisma.revenueItem.deleteMany({ where: { revenueRecord: { customerId: id } } }),
      prisma.revenueRecord.deleteMany({ where: { customerId: id } }),
      // Pipeline deals (optional relation — delete rather than nullify)
      prisma.pipelineDeal.deleteMany({ where: { customerId: id } }),
      // Action items & attachments are optional — detach instead of delete
      prisma.actionItem.updateMany({ where: { customerId: id }, data: { customerId: null } }),
      prisma.attachment.updateMany({ where: { customerId: id }, data: { customerId: null } }),
      // Delete the customer itself (cascades contacts + locations via schema)
      prisma.customer.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/customers/:id]", err);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
