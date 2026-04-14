import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  customerId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  dueDate: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const role = (session.user as { role?: string })?.role;
  const userId = session.user?.id;

  const items = await prisma.actionItem.findMany({
    where: {
      ...(role === "REP" ? { assignedToId: userId } : {}),
      ...(status ? { status: status as "TODO" | "IN_PROGRESS" | "DONE" } : {}),
    },
    include: {
      customer: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dueDate, ...rest } = parsed.data;

  const item = await prisma.actionItem.create({
    data: {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: {
      customer: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(item, { status: 201 });
}
