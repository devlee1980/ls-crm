import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (!session || role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "7d";

  const now = new Date();
  const since = new Date();
  if (range === "1d") since.setDate(now.getDate() - 1);
  else if (range === "30d") since.setDate(now.getDate() - 30);
  else since.setDate(now.getDate() - 7); // default 7d

  const [
    totalViews,
    uniqueUsers,
    topPages,
    topUsers,
    recentActivity,
    viewsByDay,
    viewsByRole,
  ] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: since } } }),

    prisma.pageView.findMany({
      where: { createdAt: { gte: since }, userId: { not: null } },
      distinct: ["userId"],
      select: { userId: true },
    }),

    prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: since } },
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),

    prisma.pageView.groupBy({
      by: ["userId", "userName", "userEmail", "userRole"],
      where: { createdAt: { gte: since }, userId: { not: null } },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }),

    prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        userId: true,
        userName: true,
        userEmail: true,
        userRole: true,
        path: true,
        userAgent: true,
        createdAt: true,
      },
    }),

    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*) AS count
      FROM page_views
      WHERE "createdAt" >= ${since}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
    `,

    prisma.pageView.groupBy({
      by: ["userRole"],
      where: { createdAt: { gte: since } },
      _count: { userRole: true },
      orderBy: { _count: { userRole: "desc" } },
    }),
  ]);

  return NextResponse.json({
    totalViews,
    uniqueUserCount: uniqueUsers.length,
    topPages: topPages.map((p) => ({ path: p.path, count: p._count.path })),
    topUsers: topUsers.map((u) => ({
      userId: u.userId,
      name: u.userName,
      email: u.userEmail,
      role: u.userRole,
      views: u._count.userId,
    })),
    recentActivity: recentActivity.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    viewsByDay: viewsByDay.map((d) => ({
      day: new Date(d.day as string | Date).toISOString().split("T")[0],
      count: Number(d.count),
    })),
    viewsByRole: viewsByRole.map((r) => ({
      role: r.userRole ?? "Unknown",
      count: r._count.userRole,
    })),
  });
}
