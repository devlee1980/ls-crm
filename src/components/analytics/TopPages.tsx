import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface TopPagesProps {
  pages: { path: string; count: number }[];
  totalViews: number;
}

export function TopPages({ pages, totalViews }: TopPagesProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Top Pages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No page data yet.
          </p>
        ) : (
          pages.map(({ path, count }) => {
            const pct = totalViews > 0 ? Math.round((count / totalViews) * 100) : 0;
            return (
              <div key={path} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium text-foreground">{path}</span>
                  </div>
                  <span className="ml-2 shrink-0 text-muted-foreground">
                    {count.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
