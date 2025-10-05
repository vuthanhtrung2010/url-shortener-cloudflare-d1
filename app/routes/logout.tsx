import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { destroySession } from "~/lib/auth";

export async function loader({ request }: Route.LoaderArgs) {
  const sessionHeader = await destroySession(request);

  return redirect("/login", {
    headers: {
      "Set-Cookie": sessionHeader,
    },
  });
}
