export default function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-2xl border border-[color:var(--danger)]/40 bg-[color:rgba(220,38,38,0.1)] px-4 py-3 text-sm text-[color:var(--danger)]"
    >
      {message}
    </div>
  );
}
