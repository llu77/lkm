import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet.tsx";
import { 
  LayoutDashboardIcon,
  TrendingUpIcon, 
  TrendingDownIcon,
  CoinsIcon,
  MenuIcon,
  LogOutIcon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth.ts";

export default function Navbar() {
  const location = useLocation();
  const { signoutRedirect } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { path: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboardIcon },
    { path: "/revenues", label: "الإيرادات", icon: TrendingUpIcon },
    { path: "/expenses", label: "المصروفات", icon: TrendingDownIcon },
    { path: "/bonus", label: "البونص", icon: CoinsIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-primary shadow-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Brand */}
        <Link to="/dashboard" className="flex items-center gap-3 text-primary-foreground font-bold text-2xl hover:opacity-90 transition-opacity">
          <img 
            src="https://cdn.hercules.app/file_vQl30LwwutdTJK2LlWgX0FdU" 
            alt="Logo"
            className="h-14 w-14 object-contain"
          />
          <span className="hidden sm:inline">نظام الإدارة المالية</span>
          <span className="sm:hidden text-lg">الإدارة المالية</span>
        </Link>

        {/* Desktop Navigation */}
        <Authenticated>
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Button
                  key={link.path}
                  variant={isActive ? "secondary" : "ghost"}
                  size="lg"
                  asChild
                  className={isActive 
                    ? "font-bold text-base" 
                    : "text-primary-foreground hover:bg-primary-foreground/20 font-semibold text-base"
                  }
                >
                  <Link to={link.path}>
                    <Icon className="size-5 ml-2" />
                    {link.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        </Authenticated>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <Authenticated>
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => signoutRedirect()}
                className="text-primary-foreground hover:bg-primary-foreground/20 font-semibold text-base"
              >
                <LogOutIcon className="size-5 ml-2" />
                تسجيل الخروج
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <MenuIcon className="size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-3 text-right text-xl font-bold">
                    <img 
                      src="https://cdn.hercules.app/file_vQl30LwwutdTJK2LlWgX0FdU" 
                      alt="Logo"
                      className="h-12 w-12 object-contain"
                    />
                    القائمة الرئيسية
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-8">
                  {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                      <Button
                        key={link.path}
                        variant={isActive ? "secondary" : "ghost"}
                        size="lg"
                        asChild
                        className={isActive ? "font-bold justify-start text-lg" : "justify-start font-semibold text-lg"}
                        onClick={() => setIsOpen(false)}
                      >
                        <Link to={link.path}>
                          <Icon className="size-6 ml-3" />
                          {link.label}
                        </Link>
                      </Button>
                    );
                  })}
                  <div className="border-t my-4" />
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setIsOpen(false);
                      signoutRedirect();
                    }}
                    className="justify-start text-destructive hover:text-destructive"
                  >
                    <LogOutIcon className="size-5 ml-3" />
                    تسجيل الخروج
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </Authenticated>
          
          <Unauthenticated>
            <SignInButton />
          </Unauthenticated>
        </div>
      </div>
    </nav>
  );
}
