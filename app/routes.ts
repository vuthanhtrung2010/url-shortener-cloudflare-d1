import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route(":alias", "routes/alias.tsx"),
  
  // Auth routes with theme provider layout
  layout("routes/auth.layout.tsx", [
    route("login", "routes/login.tsx"),
    route("register", "routes/register.tsx"),
  ]),
  route("logout", "routes/logout.tsx"),
  
  // Admin routes with layout
  layout("routes/admin.layout.tsx", [
    route("admin", "routes/admin.tsx"),
    route("admin/links", "routes/admin.links.tsx"),
    route("admin/analytics", "routes/admin.analytics.tsx"),
  ]),
  
  // API routes
  route("api/create", "routes/api.create.tsx"),
  route("api/update", "routes/api.update.tsx"),
  route("api/delete", "routes/api.delete.tsx"),
] satisfies RouteConfig;
