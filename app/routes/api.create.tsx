import { createRedirect, GenerateRandomAlias } from "~/lib/data";
import { DATA } from "~/lib/config";
import { verifyPassword } from "~/lib/password";
import type { Route } from "./+types/api.create";

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();

  const password = formData.get("password") as string;
  let alias = formData.get("alias") as string;
  const url = formData.get("url") as string;
  let baseURL = formData.get("baseURL") as string;

  if (!alias) {
    alias = await GenerateRandomAlias(context.db);
  }

  if (!baseURL) {
    baseURL = DATA.baseURL || "https://links.trunghsgs.edu.vn";
  }

  // Check password using Argon2 hash verification
  const passwordHash = process.env.PASSWORD_HASH;
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
    const success = await createRedirect(context.db, url, mapped_alias);

    if (success !== 0) {
      return Response.json(
        {
          success: false,
          message:
            success === 1
              ? "Alias already exists."
              : "Failed to create redirect.",
        },
        { status: 500 }
      );
    }

    const newURL = new URL(alias, baseURL).href;

    return Response.json({
      success: true,
      message: `Redirect created successfully.\n${newURL}`,
      url: `${newURL}`,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
