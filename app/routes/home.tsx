import { MainPage } from "~/components/main-page";
import { DATA } from "~/lib/config";

import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "URL Shortener - Trung" },
    { name: "description", content: "Personal URL shortener by Trung" },
  ];
}

export default function Home(props: Route.ComponentProps) {
  return (
    <div className="min-h-screen flex flex-col bg-backgroundColor">
      <section
        id="header"
        className="w-10/12 bg-backgroundAccent flex flex-col mx-auto rounded-md mt-10 md:w-8/12 lg:w-4/12"
      >
        {/* Profile picture */}
        <div className="flex flex-col mx-auto my-6">
          <img
            className="rounded-full"
            src={DATA.profilePicture}
            alt={DATA.name}
            width={128}
            height={128}
          />
        </div>

        {/* Info */}
        <div className="flex flex-col mx-auto mb-6">
          <h1
            style={{
              fontFamily: "'Leckerli One', cursive",
              fontSize: "2.1rem",
            }}
            className="text-primaryText text-3xl font-bold text-center"
          >
            {DATA.name}
          </h1>
        </div>
      </section>

      {/* Links */}
      <section
        id="links"
        className="w-10/12 flex flex-col mx-auto mb-10 mt-1 md:w-8/12 lg:w-4/12"
      >
        {DATA.links.map((link) => (
          <MainPage
            key={link.name}
            title={link.name}
            target={link.target}
            description={link.description}
            icon={link.icon}
          />
        ))}
      </section>
    </div>
  );
}
