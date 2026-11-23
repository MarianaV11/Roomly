import { RiChat3Fill } from "@remixicon/react";

import { cn } from "@/lib/utils";

function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <RiChat3Fill className="size-4" aria-hidden />
      </span>
      <span className="font-heading text-xl font-bold tracking-tight">Roomly</span>
    </div>
  );
}

const PREVIEW = [
  { mine: false, name: "Bia", text: "Alguém topa café às 16h? ☕" },
  { mine: true, text: "Bora! Vou chamar o pessoal do grupo" },
  { mine: false, name: "Caio", text: "Tô dentro 🙌" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      {/* ---- Side panel (desktop only): neutral, with a faint dot texture ---- */}
      <section
        aria-label="Sobre o Roomly"
        className="relative hidden flex-col justify-between overflow-hidden border-r bg-muted/40 p-12 lg:flex"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] mask-[linear-gradient(to_bottom,black,transparent_85%)] bg-size-[22px_22px]"
        />

        <Logo className="relative motion-safe:animate-in motion-safe:fade-in" />

        <div className="relative flex flex-col gap-10">
          <div className="flex flex-col gap-4 motion-safe:animate-in motion-safe:duration-700 motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
            <span className="flex w-fit items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-primary opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Mensagens em tempo real
            </span>
            <h1 className="font-heading text-4xl leading-tight font-bold text-balance">
              Converse com quem <span className="text-primary">importa</span>.
            </h1>
            <p className="max-w-sm text-lg text-muted-foreground">
              Conversas diretas e grupos públicos, num lugar só.
            </p>
          </div>

          {/* Decorative: bubbles pop in one after another, then float gently. */}
          <ul aria-hidden className="flex max-w-sm flex-col gap-3 motion-safe:animate-float">
            {PREVIEW.map((bubble, index) => (
              <li
                key={bubble.text}
                className={cn(
                  "flex max-w-[85%] flex-col gap-0.5 rounded-2xl px-4 py-2.5 text-sm shadow-sm motion-safe:animate-in motion-safe:duration-500 motion-safe:fill-mode-backwards motion-safe:zoom-in-90 motion-safe:fade-in",
                  bubble.mine
                    ? "self-end rounded-br-sm bg-primary text-primary-foreground motion-safe:slide-in-from-right-4"
                    : "self-start rounded-bl-sm border bg-background motion-safe:slide-in-from-left-4",
                )}
                style={{ animationDelay: `${400 + index * 350}ms` }}
              >
                {bubble.name && (
                  <span className="text-xs font-semibold text-muted-foreground">{bubble.name}</span>
                )}
                {bubble.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-muted-foreground">Feito para conversar.</p>
      </section>

      {/* ---- Form side ---- */}
      <main className="flex items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-8">
          <Logo className="motion-safe:animate-in motion-safe:fade-in lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
