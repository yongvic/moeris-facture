"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  label,
  loadingLabel,
  className,
  disabled,
  name,
  value,
  type = "submit",
  ariaLabel,
}: {
  label: string;
  loadingLabel?: string;
  className: string;
  disabled?: boolean;
  name?: string;
  value?: string;
  type?: "submit" | "button";
  ariaLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type={type}
      disabled={disabled || pending}
      name={name}
      value={value}
      aria-busy={pending}
      aria-label={ariaLabel}
      aria-disabled={disabled || pending}
      className={`${className} ${pending ? "opacity-70" : ""}`}
    >
      {pending ? loadingLabel ?? "En cours..." : label}
    </button>
  );
}
