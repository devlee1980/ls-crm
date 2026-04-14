import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();

  // Only track authenticated sessions
  if (!session?.user) {
    return NextResponse.json({ ok: false }, { status: 204 });
  }

  try {
    const body = await req.json();
    const { path, referrer } = body as { path?: string; referrer?: string };

    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    // Skip tracking for internal Next.js or API routes
    if (path.startsWith("/_next") || path.startsWith("/api")) {
      return NextResponse.json({ ok: true });
    }

    const userAgent = req.headers.get("user-agent") ?? undefined;
    const user = session.user as {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    };

    await prisma.pageView.create({
      data: {
        userId: user.id ?? null,
        userName: user.name ?? null,
        userEmail: user.email ?? null,
        userRole: user.role ?? null,
        path,
        referrer: referrer ?? null,
        userAgent: userAgent ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
