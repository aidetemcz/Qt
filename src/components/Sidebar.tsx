import Image from "next/image";
import Link from "next/link";
import NewPresentationButton from "@/components/NewPresentationButton";

const disabledItems = ["Templates", "Brand", "Trash"];

export default function Sidebar() {
  return (
    <aside className="flex w-full shrink-0 flex-row items-center gap-2 border-b border-neutral-200 bg-white px-4 py-3 md:min-h-screen md:w-56 md:flex-col md:items-stretch md:gap-1 md:border-r md:border-b-0 md:px-3 md:py-5">
      <Link href="/" className="mb-0 flex items-center md:mb-6 md:px-2">
        <Image src="/logo-qt.svg" alt="Q&Q logo" width={76} height={25} />
      </Link>
      <NewPresentationButton
        label="+ New presentation"
        className="hidden rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60 md:mb-6 md:block"
      />
      <Link
        href="/"
        className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
      >
        Home
      </Link>
      <span className="rounded-lg bg-brand/10 px-3 py-2 text-sm font-semibold text-brand-dark">
        Projects
      </span>
      {disabledItems.map((item) => (
        <button
          key={item}
          type="button"
          disabled
          title="Coming soon"
          className="hidden cursor-not-allowed rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-400 md:block"
        >
          {item}
        </button>
      ))}
    </aside>
  );
}
