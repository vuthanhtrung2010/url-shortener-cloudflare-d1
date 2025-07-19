import { redirect } from "react-router";
import { getURL } from "~/lib/data";
import type { Route } from "./+types/alias";

export async function loader({ params, context }: Route.LoaderArgs) {
  const { alias } = params;

  console.log(`Requesting redirect for alias: ${alias}`);

  try {
    const link = await getURL(context.db, alias);

    if (!link) {
      console.log(`No link found for alias: ${alias}`);
      throw redirect("/");
    }

    console.log(`Redirecting ${alias} to ${link}`);
    throw redirect(link);
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Re-throw redirect responses
    }
    console.error("Error processing redirect:", error);
    throw redirect("/");
  }
}
