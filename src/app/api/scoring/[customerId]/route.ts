import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  sharedVision: z.number().int().min(0).max(5).optional(),
  valueLsCapabilities: z.number().int().min(0).max(5).optional(),
  capturesScienceValue: z.number().int().min(0).max(5).optional(),
  createGrowerDemand: z.number().int().min(0).max(5).optional(),
  agronomistInfluence: z.number().int().min(0).max(5).optional(),
  trialCapability: z.number().int().min(0).max(5).optional(),
  accessStrategicMarkets: z.number().int().min(0).max(5).optional(),
  forceMultiplier: z.number().int().min(0).max(5).optional(),
  channelControl: z.number().int().min(0).max(5).optional(),
  marginAlignment: z.number().int().min(0).max(5).optional(),
  pricingPhilosophy: z.number().int().min(0).max(5).optional(),
  supplyChainStrength: z.number().int().min(0).max(5).optional(),
  easeOfDoing: z.number().int().min(0).max(5).optional(),
  financialStability: z.number().int().min(0).max(5).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { customerId } = await params;
  const score = await prisma.accountScore.findUnique({
    where: { customerId },
    include: { customer: { select: { id: true, name: true } } },
  });

  if (!score) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(score);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { customerId } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const score = await prisma.accountScore.upsert({
    where: { customerId },
    create: { customerId, ...parsed.data },
    update: parsed.data,
    include: { customer: { select: { id: true, name: true } } },
  });

  return NextResponse.json(score);
}
