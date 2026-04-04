"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Clients", href: "/clients" },
  { label: "Factures", href: "/factures" },
  { label: "Chambres", href: "/chambres" },
  { label: "Réservations", href: "/reservations" },
  { label: "Restaurant", href: "/restaurant/pos" },
  { label: "Menu", href: "/restaurant/menu" },
  { label: "Activités", href: "/activites" },
  { label: "Événements", href: "/evenements" },
  { label: "Analytics", href: "/analytics" },
];

const isActiveRoute = (pathname: string, href: string) => {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }
  return pathname.startsWith(href);
};

export default function SidebarNav({ role }: { role?: string }) {
  const pathname = usePathname();
  const items =
    role === "ADMIN"
      ? [...navItems, { label: "Admin", href: "/settings" }]
      : navItems;

  return (
    <nav className="flex flex-col gap-1 text-sm">
      {items.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-xl px-3 py-2 transition-colors ${
              active
                ? "bg-[color:var(--surface-2)] text-[color:var(--ink)] shadow-sm"
                : "text-[color:var(--ink-muted)] hover:bg-[color:var(--surface)] hover:text-[color:var(--ink)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
