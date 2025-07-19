import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("info/:alias", "routes/info.alias.tsx"),
  route("api/create", "routes/api.create.tsx"),
  route("api/update", "routes/api.update.tsx"),
  route("api/delete", "routes/api.delete.tsx"),
  route(":alias", "routes/alias.tsx"),
] satisfies RouteConfig;
