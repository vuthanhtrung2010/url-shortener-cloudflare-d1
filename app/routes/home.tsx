import { DATA } from "~/lib/config";
import { Link } from "react-router";

import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "URL Shortener - Trung" },
    { name: "description", content: "Personal URL shortener by Trung" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-backgroundColor relative overflow-hidden">
      {/* Subtle static background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-backgroundColor via-backgroundColor to-backgroundAccent/30"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-lightAccent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center pt-16 pb-20">
        {/* Profile Section with Glass Morphism */}
        <section className="w-11/12 max-w-md mx-auto mb-12">
          <div className="bg-backgroundAccent/80 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-2xl hover:shadow-accent/20 transition-all duration-500 hover:border-accent/30">
            {/* Profile picture with enhanced styling */}
            <div className="relative mx-auto mb-6 w-36 h-36">
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-lightAccent rounded-full p-1">
                <img
                  className="rounded-full w-full h-full object-cover bg-backgroundColor"
                  src={DATA.profilePicture}
                  alt={DATA.name}
                />
              </div>
            </div>

            {/* Name with enhanced typography */}
            <div className="text-center">
              <h1
                style={{
                  fontFamily: "'Leckerli One', cursive",
                }}
                className="text-4xl font-bold bg-gradient-to-r from-primaryText via-accent to-lightAccent bg-clip-text text-transparent mb-2"
              >
                {DATA.name}
              </h1>
              <p className="text-secondaryText text-lg">Developer & Creator</p>
            </div>
          </div>
        </section>

        {/* Links Grid with Modern Cards */}
        <section className="w-11/12 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DATA.links.map((link, index) => (
              <div
                key={link.name}
                className="group animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Link
                  to={link.target}
                  className="block bg-backgroundAccent/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 
                           hover:bg-backgroundAccent/80 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/20
                           transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="flex items-center space-x-4">
                    {/* Icon with gradient border */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-accent/20 to-lightAccent/20 rounded-xl p-0.5 group-hover:from-accent/40 group-hover:to-lightAccent/40 transition-all duration-300">
                        <img
                          src={link.icon}
                          alt={link.name}
                          className="w-full h-full object-cover rounded-xl bg-backgroundColor/50"
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-primaryText font-semibold text-lg group-hover:text-accent transition-colors duration-300 truncate">
                        {link.name}
                      </h3>
                      <p className="text-secondaryText text-sm mt-1 group-hover:text-primaryText transition-colors duration-300 truncate">
                        {link.description}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 pb-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-backgroundAccent/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-secondaryText mb-2">
              Made by <a href="https://discord.gg/TR8k3MtjNZ" className="text-accent hover:text-lightAccent transition-colors">Vũ Thành Trung</a> |{" "}
              <a href="https://github.com/vuthanhtrung2010/url-shortener" className="text-accent hover:text-lightAccent transition-colors">
                Github
              </a>
            </div>
            <div className="text-secondaryText text-sm">
              <p>&copy; 2025 Trung - All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
