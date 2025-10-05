import { deleteRedirect } from "~/lib/data";
import { getUserFromSession } from "~/lib/auth";
import type { Route } from "./+types/api.delete";

export async function action({ request, context }: Route.ActionArgs) {
  // Check authentication
  const user = await getUserFromSession(request);
  if (!user) {
    return Response.json(
      { success: false, message: "Authentication required" },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const alias = formData.get("alias") as string;

  const mapped_alias: string[] = alias
    .split(" ")
    .map((a) => a.trim())
    .filter((a) => a);

  try {
    await deleteRedirect(context.db, mapped_alias);
    return Response.json({
      success: true,
      message: "Redirect deleted successfully",
    });
  } catch (error) {
    return Response.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
