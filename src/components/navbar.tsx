import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { 
  LayoutDashboardIcon,
  TrendingUpIcon, 
  TrendingDownIcon, 
  PackageIcon, 
  UsersIcon,
  InboxIcon,
  LogOutIcon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth.ts";

export default function Navbar() {
  const location = useLocation();
  const { signoutRedirect } = useAuth();

  const links = [
    { path: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboardIcon },
    { path: "/revenues", label: "الإيرادات", icon: TrendingUpIcon },
    { path: "/expenses", label: "المصروفات", icon: TrendingDownIcon },
    { path: "/product-orders", label: "طلبات المنتجات", icon: PackageIcon },
    { path: "/employee-orders", label: "طلبات الموظفين", icon: UsersIcon },
    { path: "/my-requests", label: "صندوق طلباتي", icon: InboxIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-primary">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-primary-foreground font-bold text-xl">
            <LayoutDashboardIcon className="size-6" />
            <span>نظام الإدارة</span>
          </Link>
          <Authenticated>
            <div className="hidden lg:flex items-center gap-2">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Button
                    key={link.path}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    asChild
                    className={isActive ? "" : "text-primary-foreground hover:bg-primary-foreground/10"}
                  >
                    <Link to={link.path}>
                      <Icon className="size-4 mr-2" />
                      {link.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </Authenticated>
        </div>
        <div className="flex items-center gap-2">
          <Authenticated>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signoutRedirect()}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOutIcon className="size-4 mr-2" />
              تسجيل الخروج
            </Button>
          </Authenticated>
          <Unauthenticated>
            <SignInButton />
          </Unauthenticated>
        </div>
      </div>
    </nav>
  );
}
