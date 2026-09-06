import Image from "next/image";
import Link from "next/link";
import NewPresentationButton from "@/components/NewPresentationButton";

const disabledItems = ["Šablony", "Značka", "Koš"];

export default function Sidebar() {
  return (
    <aside className="topbar flex w-full shrink-0 flex-row items-center gap-2 px-4 py-3 md:min-h-screen md:w-60 md:flex-col md:items-stretch md:gap-1 md:border-r md:border-b-0 md:px-4 md:py-6">
      <Link
        href="/"
        className="mb-0 flex items-center transition-opacity duration-150 hover:opacity-80 md:mb-7 md:px-2"
      >
        <Image src="/logo-qt.svg" alt="Qt logo" width={76} height={25} />
      </Link>
      <NewPresentationButton
        label="+ Nová prezentace"
        className="btn btn-primary hidden w-full md:mb-7 md:inline-flex"
      />
      <Link
        href="/"
        className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors duration-150 hover:bg-brand-50 hover:text-brand"
      >
        Domů
      </Link>
      <Link
        href="/dashboard"
        className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-dark"
      >
        Prezentace
      </Link>
      <Link
        href="/profile"
        className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors duration-150 hover:bg-brand-50 hover:text-brand"
      >
        Profil
      </Link>
      {disabledItems.map((item) => (
        <button
          key={item}
          type="button"
          disabled
          title="Připravujeme"
          className="hidden cursor-not-allowed rounded-xl px-3 py-2 text-left text-sm font-medium text-neutral-400 md:block"
        >
          {item}
        </button>
      ))}
    </aside>
  );
}
