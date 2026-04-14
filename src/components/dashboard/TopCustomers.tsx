import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/StarRating";
import { formatCurrency } from "@/lib/formatters";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  rating: number;
  status: string;
  totalRevenue: number;
}

export function TopCustomers({ customers }: { customers: Customer[] }) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Top Customers</CardTitle>
        <Link
          href="/customers"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {customers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No customers yet. Add your first customer to get started.
          </p>
        ) : (
          customers.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <StarRating rating={c.rating} size="sm" />
              </div>
              <div className="text-right ml-2 shrink-0">
                <p className="text-sm font-semibold">{formatCurrency(c.totalRevenue)}</p>
                <Badge
                  variant={c.status === "ACTIVE" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {c.status}
                </Badge>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
