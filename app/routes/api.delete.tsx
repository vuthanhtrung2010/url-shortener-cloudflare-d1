import { deleteRedirect } from "~/lib/data";
import { verifyPassword } from "~/lib/password";
import type { Route } from "./+types/api.delete";

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const password = formData.get("password") as string;
  const alias = formData.get("alias") as string;

  // Check password using Argon2 hash verification
  const passwordHash = context.cloudflare.env.ADMIN_PASSWORD_HASH;
  if (!passwordHash || !(await verifyPassword(passwordHash, password))) {
    return Response.json(
      { success: false, message: "Invalid password." },
      { status: 401 }
    );
  }

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
