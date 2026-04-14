import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
  activity: {
    id: string;
    userName: string | null;
    userEmail: string | null;
    userRole: string | null;
    path: string;
    userAgent: string | null;
    createdAt: string;
  }[];
}

function parseDevice(ua: string | null): string {
  if (!ua) return "Unknown";
  if (/mobile/i.test(ua)) return "Mobile";
  if (/tablet|ipad/i.test(ua)) return "Tablet";
  return "Desktop";
}

function parseBrowser(ua: string | null): string {
  if (!ua) return "";
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  if (/firefox/i.test(ua)) return "Firefox";
  return "Browser";
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "text-orange-600",
  MANAGER: "text-blue-600",
  REP: "text-emerald-600",
};

export function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground whitespace-nowrap">User</th>
                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Page</th>
                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground whitespace-nowrap">Device</th>
                  <th className="text-left py-2 font-medium text-muted-foreground whitespace-nowrap">When</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activity.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2 pr-3">
                      <div className="whitespace-nowrap">
                        <span className="font-medium">{a.userName ?? "Unknown"}</span>
                        {a.userRole && (
                          <span
                            className={`ml-1.5 text-[10px] font-semibold ${
                              ROLE_COLOR[a.userRole] ?? "text-muted-foreground"
                            }`}
                          >
                            {a.userRole}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{a.userEmail ?? ""}</div>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs max-w-[200px] truncate">
                      {a.path}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <span className="text-muted-foreground">
                        {parseDevice(a.userAgent)} · {parseBrowser(a.userAgent)}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
