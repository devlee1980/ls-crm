import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ALLOWED_TIMEOUTS = [5, 15, 30, 60, 240, 480] as const;

const patchSchema = z.object({
  sessionTimeoutMinutes: z.number().refine(
    (v) => (ALLOWED_TIMEOUTS as readonly number[]).includes(v),
    { message: "Invalid timeout value" }
  ),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { sessionTimeoutMinutes: parsed.data.sessionTimeoutMinutes },
    select: { id: true, sessionTimeoutMinutes: true },
  });

  return NextResponse.json(updated);
}
