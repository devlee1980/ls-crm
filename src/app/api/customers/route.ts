import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getDivisionFilter } from "@/lib/division";
import {
  isBlankAccountNumber,
  normalizeAccountNumber,
  nextSequentialAccountNumber,
} from "@/lib/customer-account-number";

const customerSchema = z.object({
  name: z.string().min(1),
  accountNumber: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  type: z.enum(["DISTRIBUTOR", "RETAILER", "DIRECT", "OTHER"]).default("DISTRIBUTOR"),
  wholesalePercent: z.number().min(0).max(100).default(0),
  retailPercent: z.number().min(0).max(100).default(100),
  rating: z.number().min(0).max(5).default(0),
  status: z.enum(["ACTIVE", "INACTIVE", "PROSPECT"]).default("ACTIVE"),
  notes: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  assignedRepId: z.string().optional().nullable(),
  division: z.enum(["LS_US", "LS_CANADA"]).optional().nullable(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");

  const role = (session.user as { role?: string })?.role ?? "REP";
  const userId = session.user?.id;
  const division = (session.user as { division?: string | null })?.division;

  const customers = await prisma.customer.findMany({
    where: {
      ...getDivisionFilter(role, division),
      ...(role === "REP" ? { assignedRepId: userId } : {}),
      ...(status ? { status: status as "ACTIVE" | "INACTIVE" | "PROSPECT" } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { accountNumber: { contains: search, mode: "insensitive" } },
              { industry: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      assignedRep: { select: { name: true } },
      _count: { select: { locations: true, contacts: true, actionItems: true, forecasts: true } },
      revenueRecords: { select: { totalAmount: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role ?? "REP";
  const sessionDivision = (session.user as { division?: string | null })?.division;

  const body = await req.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // ADMIN can set division explicitly from the form; all others get their own division
  const division = role === "ADMIN" ? (parsed.data.division ?? null) : (sessionDivision ?? null);

  const { accountNumber: rawAccountNumber, ...rest } = parsed.data;
  const userSuppliedAccount = !isBlankAccountNumber(rawAccountNumber);
  let accountNumber = normalizeAccountNumber(rawAccountNumber);
  if (accountNumber === null) {
    accountNumber = await nextSequentialAccountNumber();
  }

  const maxAttempts = userSuppliedAccount ? 1 : 5;
  let customer;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      customer = await prisma.customer.create({
        data: {
          ...rest,
          accountNumber,
          division: division as "LS_US" | "LS_CANADA" | null,
        },
      });
      break;
    } catch (e) {
      const dupAccount =
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        Array.isArray(e.meta?.target) &&
        (e.meta.target as string[]).includes("accountNumber");
      if (!userSuppliedAccount && dupAccount && attempt < maxAttempts - 1) {
        accountNumber = await nextSequentialAccountNumber();
        continue;
      }
      throw e;
    }
  }

  if (!customer) {
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
  return NextResponse.json(customer, { status: 201 });
}
