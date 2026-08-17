import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default async function LandingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4 md:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Empezar gratis</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5" />
          Funnels interactivos creados por IA
        </span>
        <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Describe tu negocio y tu objetivo.
          <br />
          La IA crea tu funnel listo para publicar.
        </h1>
        <p className="mt-4 max-w-xl text-balance text-muted-foreground">
          Quizzes, diagnósticos y recomendadores que convierten visitantes en
          leads. Sin programar, sin diseñadores, en minutos.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">
              Crear mi primer funnel
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Ya tengo cuenta</Link>
          </Button>
        </div>
      </main>

      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        AI Funnel Creator — MVP en desarrollo
      </footer>
    </div>
  );
}
