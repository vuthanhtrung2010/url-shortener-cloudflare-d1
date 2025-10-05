import { useState, useEffect } from "react";
import { Form, redirect, useLoaderData, useActionData } from "react-router";
import type { Route } from "./+types/register";
import { createUser, getUserByUsername } from "~/lib/data";
import { createSession, getUserFromSession } from "~/lib/auth";
import { verifyTurnstile, getTurnstileSiteKey } from "~/lib/turnstile";
import { useTheme } from "~/components/ThemeProvider";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { MagicCard } from "~/components/ui/magic-card";
import { AlertCircle, Shield } from "lucide-react";
import Turnstile from "react-turnstile";

export async function loader({ request, context }: Route.LoaderArgs) {
  // If already logged in, redirect to admin
  const user = await getUserFromSession(request);
  if (user) {
    return redirect("/admin/links");
  }

  // Check if any users exist
  const allUsers = await context.db.query.users.findMany();
  const isFirstUser = allUsers.length === 0;

  // Check if registration is allowed
  const allowRegistration =
    (typeof process !== "undefined"
      ? process.env?.VITE_ACCOUNT_ALLOW_SELF_REGISTERATION
      : undefined) ||
    (typeof import.meta !== "undefined"
      ? import.meta.env?.VITE_ACCOUNT_ALLOW_SELF_REGISTERATION
      : undefined) === "1";

  // If users exist and registration is not allowed, redirect
  if (!isFirstUser && !allowRegistration) {
    return redirect("/login");
  }

  return {
    turnstileSiteKey: getTurnstileSiteKey(),
    isFirstUser,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const turnstileToken = formData.get("cf-turnstile-response") as string;

  // Validate email
  if (!email || !email.includes("@")) {
    return { error: "Please provide a valid email address" };
  }

  // Validate passwords match
  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  // Validate password strength
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  // Verify turnstile if enabled
  const turnstileValid = await verifyTurnstile(turnstileToken);
  if (!turnstileValid) {
    return { error: "Please complete the captcha" };
  }

  // Create user
  const result = await createUser(context.db, username, email, password);

  if (!result.success) {
    return { error: result.message };
  }

  // Get the newly created user
  const user = await getUserByUsername(context.db, username);

  if (!user) {
    return { error: "Account created but failed to login" };
  }

  // Create session
  const sessionHeader = await createSession({
    userId: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    passwordChangedAt: user.passwordChangedAt ? new Date(user.passwordChangedAt).getTime() : undefined,
  });

  return redirect("/admin/links", {
    headers: {
      "Set-Cookie": sessionHeader,
    },
  });
}

export default function Register() {
  const { turnstileSiteKey, isFirstUser } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="p-0 max-w-sm w-full shadow-none border-none">
        <MagicCard
          gradientColor={mounted && theme === "dark" ? "#262626" : "#D9D9D955"}
          className="p-0"
        >
          <CardHeader className="border-b border-border p-4">
            <CardTitle>Register</CardTitle>
            <CardDescription>
              Create a new account
              {isFirstUser && (
                <div className="flex items-center gap-2 mt-2 text-green-600">
                  <Shield size={16} />
                  <span className="font-semibold">
                    You'll be the first user and get admin privileges!
                  </span>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <Form method="post">
              <div className="flex flex-col gap-6">
                {actionData?.error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{actionData.error}</span>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Choose a username"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="At least 8 characters"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    required
                  />
                </div>

                {turnstileSiteKey && (
                  <div className="grid gap-2">
                    <Turnstile
                      sitekey={turnstileSiteKey}
                      theme={mounted && theme === "dark" ? "dark" : "light"}
                    />
                  </div>
                )}
              </div>

              <CardFooter className="flex-col gap-2 p-0 mt-6">
                <Button type="submit" className="w-full">
                  Register
                </Button>
                <div className="text-sm text-center">
                  Already have an account?{" "}
                  <a href="/login" className="text-primary hover:underline">
                    Login
                  </a>
                </div>
              </CardFooter>
            </Form>
          </CardContent>
        </MagicCard>
      </Card>
    </div>
  );
}
