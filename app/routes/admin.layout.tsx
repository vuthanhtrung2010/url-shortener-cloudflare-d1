import { Outlet } from "react-router";
import type { Route } from "./+types/admin.layout";
import { requireAuth } from "~/lib/auth";
import { ThemeProvider } from "~/components/ThemeProvider";
import { AuthProvider } from "~/components/AuthProvider";
import { AdminSidebar } from "~/components/AdminSidebar";
import { TooltipProvider } from "~/components/ui/tooltip";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  
  return {
    user,
  };
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="url-shortener-theme">
      <AuthProvider user={loaderData.user}>
        <TooltipProvider>
          <AdminSidebar>
            <Outlet />
          </AdminSidebar>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
