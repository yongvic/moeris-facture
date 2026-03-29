"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Clients", href: "/clients" },
  { label: "Factures", href: "/factures" },
  { label: "Chambres", href: "/chambres" },
  { label: "Restaurant", href: "/restaurant/pos" },
  { label: "Activités", href: "/activites" },
  { label: "Événements", href: "/evenements" },
  { label: "Analytics", href: "/analytics" },
  { label: "Admin", href: "/settings" },
];

const isActiveRoute = (pathname: string, href: string) => {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }
  return pathname.startsWith(href);
};

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 text-sm">
      {navItems.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
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
