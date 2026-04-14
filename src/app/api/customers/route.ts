import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");

  const role = (session.user as { role?: string })?.role;
  const userId = session.user?.id;

  const customers = await prisma.customer.findMany({
    where: {
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

  const body = await req.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const customer = await prisma.customer.create({ data: parsed.data });
  return NextResponse.json(customer, { status: 201 });
}
