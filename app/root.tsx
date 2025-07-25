import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export function meta({}: Route.MetaArgs): Route.MetaDescriptors {
  return [
    { title: "Trung's URL Shortener" },
    { 
      name: "description", 
      content: "Trung's URL Shortener" 
    },
    {
      property: "og:title",
      content: "Vũ Thành Trung"
    },
    {
      property: "og:description", 
      content: "Trung's URL Shortener"
    },
    {
      property: "og:image",
      content: "/assets/meta/banner.webp"
    },
    {
      name: "twitter:title",
      content: "Vũ Thành Trung"
    },
    {
      name: "twitter:card",
      content: "summary_large_image"
    },
    {
      name: "twitter:description",
      content: "A website which displays my Spotify status."
    },
    {
      name: "twitter:image",
      content: "/assets/meta/banner.webp"
    },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <div className="footer-container">
          <div className="credit" id="credit">
            Made by <a href="https://discord.gg/TR8k3MtjNZ">Vũ Thành Trung</a> |{" "}
            <a href="https://github.com/vuthanhtrung2010/url-shortener">
              Github
            </a>
          </div>
          <div className="space-y-0">
            <p>&copy; 2025 Trung - All Rights Reserved.</p>
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
