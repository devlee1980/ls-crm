import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { ActionPriority } from "@prisma/client";

interface Action {
  id: string;
  title: string;
  priority: ActionPriority;
  dueDate: Date | null;
  customer: { name: string } | null;
}

const priorityVariant: Record<ActionPriority, "destructive" | "default" | "secondary" | "outline"> = {
  URGENT: "destructive",
  HIGH: "default",
  MEDIUM: "secondary",
  LOW: "outline",
};

export function UpcomingActions({ actions }: { actions: Action[] }) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Upcoming Action Items</CardTitle>
        <Link
          href="/action-items"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No upcoming action items. Great job staying on top of things!
          </p>
        ) : (
          <div className="divide-y">
            {actions.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3 gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  {a.customer && (
                    <p className="text-xs text-muted-foreground">{a.customer.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={priorityVariant[a.priority]} className="text-xs">
                    {a.priority}
                  </Badge>
                  {a.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(a.dueDate)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
