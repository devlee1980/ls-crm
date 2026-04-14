import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const scoreSchema = z.object({
  customerId: z.string().min(1),
  sharedVision: z.number().int().min(0).max(5).default(0),
  valueLsCapabilities: z.number().int().min(0).max(5).default(0),
  capturesScienceValue: z.number().int().min(0).max(5).default(0),
  createGrowerDemand: z.number().int().min(0).max(5).default(0),
  agronomistInfluence: z.number().int().min(0).max(5).default(0),
  trialCapability: z.number().int().min(0).max(5).default(0),
  accessStrategicMarkets: z.number().int().min(0).max(5).default(0),
  forceMultiplier: z.number().int().min(0).max(5).default(0),
  channelControl: z.number().int().min(0).max(5).default(0),
  marginAlignment: z.number().int().min(0).max(5).default(0),
  pricingPhilosophy: z.number().int().min(0).max(5).default(0),
  supplyChainStrength: z.number().int().min(0).max(5).default(0),
  easeOfDoing: z.number().int().min(0).max(5).default(0),
  financialStability: z.number().int().min(0).max(5).default(0),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scores = await prisma.accountScore.findMany({
    include: { customer: { select: { id: true, name: true, status: true, assignedRep: { select: { name: true } } } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(scores);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = scoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { customerId, ...data } = parsed.data;

  const score = await prisma.accountScore.upsert({
    where: { customerId },
    create: { customerId, ...data },
    update: data,
    include: { customer: { select: { id: true, name: true } } },
  });

  return NextResponse.json(score, { status: 201 });
}
