import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { Toaster } from "@/components/ui/sonner";
import { Film, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

import appCss from "../styles.css?url";

interface RouterContext {
  queryClient: QueryClient;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-8xl text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Scene not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page rolled off the cutting room floor.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-smooth"
        >
          Back to lobby
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PulseReel — Real-time Movie Trends" },
      { name: "description", content: "Cloud-based event analysis platform tracking real-time popularity of movie releases through user views and likes." },
      { property: "og:title", content: "PulseReel — Real-time Movie Trends" },
      { property: "og:description", content: "Track trending movie events with live view and like analytics." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Header({ session, isAdmin }: { session: Session | null; isAdmin: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-xl bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero shadow-glow group-hover:scale-110 transition-smooth">
            <Film className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl tracking-wider">PULSE<span className="text-gradient">REEL</span></span>
        </Link>
        <nav className="flex items-center gap-2">
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <Shield className="h-4 w-4" /> Admin
              </Button>
            </Link>
          )}
          {session ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-gradient-hero text-primary-foreground border-0 hover:opacity-90 shadow-glow">
                Sign in
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(async () => {
          const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.user.id);
          setIsAdmin(!!data?.some((r) => r.role === "admin"));
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        supabase.from("user_roles").select("role").eq("user_id", s.user.id).then(({ data }) => {
          setIsAdmin(!!data?.some((r) => r.role === "admin"));
        });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <Header session={session} isAdmin={isAdmin} />
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
          PulseReel · Real-time event analytics powered by Lovable Cloud
        </footer>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
