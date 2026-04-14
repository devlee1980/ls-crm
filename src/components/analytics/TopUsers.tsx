import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TopUsersProps {
  users: {
    userId: string | null;
    name: string | null;
    email: string | null;
    role: string | null;
    views: number;
  }[];
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-orange-100 text-orange-700",
  MANAGER: "bg-blue-100 text-blue-700",
  REP: "bg-emerald-100 text-emerald-700",
};

export function TopUsers({ users }: TopUsersProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Most Active Users</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No user activity yet.
          </p>
        ) : (
          <div className="divide-y">
            {users.map((u, i) => (
              <div key={u.userId ?? i} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email ?? ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {u.role && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        ROLE_BADGE[u.role] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {u.role}
                    </span>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {u.views.toLocaleString()} views
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
