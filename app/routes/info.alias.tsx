import { redirect, Link } from "react-router";
import { getData } from "~/lib/data";
import type { Route } from "./+types/info.alias";

export async function loader({ params, context }: Route.LoaderArgs) {
  const { alias } = params;

  console.log(`Requesting data for alias: ${alias}`);
  const link = await getData(context.db, alias);

  if (!link) {
    console.log(`Not found any data contains alias: ${alias}. Redirecting user to '/' route`);
    throw redirect("/");
  }

  console.log(`Found ${link} with alias ${alias}!`);
  return { link };
}

export default function InfoPage({ loaderData }: Route.ComponentProps) {
  const { link } = loaderData;
  const href = `/${link.alias}`;
  
  const createdAt = new Date(link.createdAt).toLocaleString();

  return (
    <div className="min-h-screen flex items-center justify-center bg-backgroundColor">
      <div className="p-8 text-white text-center rounded-lg shadow-lg bg-backgroundAccent">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">Redirect Information</h1>
        </header>
        <p className="mb-2">
          <span className="font-semibold">Path</span>:
          <Link className="text-blue-500 hover:text-blue-600" to={href}>
            {" "}
            /{link.alias}
          </Link>
        </p>
        <p className="mb-2">
          <span className="font-semibold">Redirect</span>:
          <Link className="text-blue-500 hover:text-blue-600" to={link.link}>
            {" "}
            {link.link}
          </Link>
        </p>
        <p className="mb-2">
          <span className="font-semibold">Created</span>: {createdAt}
        </p>
        <p className="mb-6">
          <span className="font-semibold">Hits</span>: {link.hits}
        </p>
        <Link
          to="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
