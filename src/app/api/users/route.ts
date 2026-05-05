import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const userCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMIN", "MANAGER", "REP", "CS_REP"]).default("REP"),
  division: z.enum(["LS_US", "LS_CANADA"]).optional().nullable(),
  region: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const division = searchParams.get("division");

  const users = await prisma.user.findMany({
    where: {
      ...(division ? { division: division as "LS_US" | "LS_CANADA" } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      division: true,
      region: true,
      isActive: true,
      createdAt: true,
      mfaEnabled: true,
      mfaEnrolledAt: true,
      _count: { select: { customers: true, actionItems: true } },
    },
    orderBy: [{ division: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists." },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
      password: hashed,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      division: true,
      region: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
