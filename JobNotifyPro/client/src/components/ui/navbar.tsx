import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            Job Board Admin
          </Link>
          <div className="flex gap-4">
            <Link href="/jobs" className="text-muted-foreground hover:text-foreground">
              Jobs
            </Link>
            <Link href="/subscribers" className="text-muted-foreground hover:text-foreground">
              Subscribers
            </Link>
            <Link href="/campaigns" className="text-muted-foreground hover:text-foreground">
              Campaigns
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user?.username}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
