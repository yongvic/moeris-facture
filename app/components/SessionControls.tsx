"use client";

import { signOut } from "next-auth/react";

export default function SessionControls() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-full border border-[color:var(--stroke)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--accent)]"
    >
      Déconnexion
    </button>
  );
}
