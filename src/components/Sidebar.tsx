import Image from "next/image";
import Link from "next/link";
import NewPresentationButton from "@/components/NewPresentationButton";

/** Zbytek navigace; Domů a Prezentace stojí výš a mají vlastní vzhled. */
const links = [
  { href: "/templates", label: "Šablony" },
  { href: "/brand", label: "Značka" },
  { href: "/trash", label: "Koš" },
  { href: "/profile", label: "Profil" },
];

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
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors duration-150 hover:bg-brand-50 hover:text-brand"
        >
          {link.label}
        </Link>
      ))}
    </aside>
  );
}
