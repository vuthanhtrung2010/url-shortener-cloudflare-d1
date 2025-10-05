import { useState, useEffect } from "react";
import { Form, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import { AlertCircle } from "lucide-react";
import Turnstile from "react-turnstile";
import { MagicCard } from "~/components/ui/magic-card";
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
import { verifyUser } from "~/lib/data";
import { createSession, getUserFromSession } from "~/lib/auth";
import { verifyTurnstile, getTurnstileSiteKey } from "~/lib/turnstile";
import { useTheme } from "~/components/ThemeProvider";

export async function loader({ request, context }: Route.LoaderArgs) {
  // If already logged in, redirect to admin
  const user = await getUserFromSession(request);
  if (user) {
    return redirect("/admin");
  }

  return {
    turnstileSiteKey: getTurnstileSiteKey(),
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const turnstileToken = formData.get("cf-turnstile-response") as string;

  // Verify Turnstile if configured
  const turnstileValid = await verifyTurnstile(turnstileToken);
  if (!turnstileValid) {
    return {
      error: "Please complete the CAPTCHA verification",
    };
  }

  // Verify credentials
  const result = await verifyUser(context.db, email, password);

  if (!result.success || !result.user) {
    return {
      error: result.message || "Invalid email or password",
    };
  }

  // Create session
  const sessionHeader = await createSession({
    userId: result.user.id,
    username: result.user.username,
    email: result.user.email,
    isAdmin: result.user.isAdmin,
    passwordChangedAt: result.user.passwordChangedAt ? new Date(result.user.passwordChangedAt).getTime() : undefined,
  });

  return redirect("/admin", {
    headers: {
      "Set-Cookie": sessionHeader,
    },
  });
}

export default function LoginPage() {
  const { turnstileSiteKey } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [turnstileStatus, setTurnstileStatus] = useState<
    "success" | "error" | "expired" | "required"
  >("required");

  const isSubmitting = navigation.state === "submitting";

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
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <Form method="post">
              <div className="flex flex-col gap-6">
                {actionData?.error && (
                  <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{actionData.error}</span>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {turnstileSiteKey && (
                  <div className="grid gap-2">
                    <Turnstile
                      sitekey={turnstileSiteKey}
                      retry="auto"
                      refreshExpired="auto"
                      onError={() => {
                        setTurnstileStatus("error");
                      }}
                      onExpire={() => {
                        setTurnstileStatus("expired");
                      }}
                      onLoad={() => {
                        setTurnstileStatus("required");
                      }}
                      onVerify={() => {
                        setTurnstileStatus("success");
                      }}
                      theme={mounted && theme === "dark" ? "dark" : "light"}
                    />
                  </div>
                )}
              </div>
              <CardFooter className="flex-col gap-2 p-0 mt-6">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
                <p className="text-sm text-center text-muted-foreground mt-2">
                  Don't have an account?{" "}
                  <a href="/register" className="text-primary hover:underline">
                    Register
                  </a>
                </p>
              </CardFooter>
            </Form>
          </CardContent>
        </MagicCard>
      </Card>
    </div>
  );
}
