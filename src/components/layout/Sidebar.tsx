"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  TrendingUp,
  CheckSquare,
  FlaskConical,
  LogOut,
  ChevronRight,
  UserCog,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/products", label: "Item Master", icon: Package },
  { href: "/forecast", label: "Forecasting", icon: TrendingUp },
  { href: "/action-items", label: "Action Items", icon: CheckSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "ADMIN";

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="bg-[#E85A1E] rounded-lg p-2">
          <FlaskConical className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-sidebar-foreground font-bold text-lg tracking-tight">
            LS Nexus
          </span>
          <p className="text-xs text-sidebar-foreground/50">LifeScientific CRM</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
            </Link>
          );
        })}

        {/* Admin-only section */}
        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-sidebar-foreground/30">
                Admin
              </p>
            </div>
            <Link
              href="/users"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                pathname.startsWith("/users")
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <UserCog className="h-4 w-4 shrink-0" />
              <span className="flex-1">Users</span>
              {pathname.startsWith("/users") && (
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              )}
            </Link>
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
