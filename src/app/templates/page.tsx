import Link from "next/link";
import { createFromTemplate } from "@/app/dashboard/actions";
import Sidebar from "@/components/Sidebar";
import SlideView from "@/components/slide/SlideView";
import { TEMPLATES } from "@/lib/templates";

export const metadata = {
  title: "Šablony · Qt",
};

/** 1 slide, 2–4 slidy, jinak slidů. */
function slideWord(count: number): string {
  if (count === 1) {
    return "slide";
  }
  return count >= 2 && count <= 4 ? "slidy" : "slidů";
}

export default function TemplatesPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Šablony</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                Začni s hotovou kostrou
              </h1>
            </div>
            <Link href="/dashboard" className="btn btn-secondary btn-sm">
              ← Prezentace
            </Link>
          </div>

          <p className="mt-4 max-w-2xl text-sm text-muted">
            Šablona založí prezentaci i se slidy. Všechno v ní jde přepsat,
            takže ti ušetří skládání, ne psaní.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((template) => (
              <form
                key={template.id}
                action={async () => {
                  "use server";
                  await createFromTemplate(template.id);
                }}
                className="card card-interactive animate-slide-up flex flex-col overflow-hidden"
              >
                {/* Náhled je skutečný první slide, ne obrázek. */}
                <div className="pointer-events-none border-b border-border">
                  <SlideView config={template.slides[0].config} />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-ink">
                    <span aria-hidden>{template.glyph}</span>
                    {template.title}
                  </p>
                  <p className="text-xs leading-snug text-muted">
                    {template.description}
                  </p>
                  <p className="mt-auto pt-2 text-xs text-muted">
                    {template.slides.length} {slideWord(template.slides.length)}
                  </p>
                  <button type="submit" className="btn btn-primary btn-sm mt-1">
                    Použít šablonu
                  </button>
                </div>
              </form>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
