"use client";

import { useState, useEffect, useCallback } from "react";
import { AnalyticsKPIs } from "./AnalyticsKPIs";
import { PageViewsChart } from "./PageViewsChart";
import { RoleBreakdown } from "./RoleBreakdown";
import { TopPages } from "./TopPages";
import { TopUsers } from "./TopUsers";
import { RecentActivity } from "./RecentActivity";
import { Loader2 } from "lucide-react";

type Range = "1d" | "7d" | "30d";

interface AnalyticsData {
  totalViews: number;
  uniqueUserCount: number;
  topPages: { path: string; count: number }[];
  topUsers: {
    userId: string | null;
    name: string | null;
    email: string | null;
    role: string | null;
    views: number;
  }[];
  recentActivity: {
    id: string;
    userName: string | null;
    userEmail: string | null;
    userRole: string | null;
    path: string;
    userAgent: string | null;
    createdAt: string;
  }[];
  viewsByDay: { day: string; count: number }[];
  viewsByRole: { role: string; count: number }[];
}

const RANGE_LABELS: Record<Range, string> = {
  "1d": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

export function AnalyticsDashboard() {
  const [range, setRange] = useState<Range>("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (r: Range) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${r}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex items-center gap-2">
        {(["1d", "7d", "30d"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              range === r
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-1" />}
      </div>

      {!data && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          Failed to load analytics data.
        </div>
      )}

      {data && (
        <>
          <AnalyticsKPIs
            totalViews={data.totalViews}
            uniqueUserCount={data.uniqueUserCount}
            topPageCount={data.topPages.length}
            activeRoles={data.viewsByRole.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PageViewsChart data={data.viewsByDay} />
            </div>
            <RoleBreakdown data={data.viewsByRole} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopPages pages={data.topPages} totalViews={data.totalViews} />
            <TopUsers users={data.topUsers} />
          </div>

          <RecentActivity activity={data.recentActivity} />
        </>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
