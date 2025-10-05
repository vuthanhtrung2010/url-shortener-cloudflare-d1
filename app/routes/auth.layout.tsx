import { Outlet } from "react-router";
import { ThemeProvider } from "~/components/ThemeProvider";
import { ModeToggle } from "~/components/ThemeToggle";

export default function AuthLayout() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="url-shortener-theme">
      <div className="relative min-h-screen">
        {/* Theme Toggle in Top Right */}
        <div className="fixed top-4 right-4 z-50">
          <ModeToggle />
        </div>
        
        <Outlet />
      </div>
    </ThemeProvider>
  );
}
