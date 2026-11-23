import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  id: string;
  label: string;
  hint?: string;
  error?: FieldError;
  registration: UseFormRegisterReturn;
} & React.ComponentProps<"input">;

/** Label + input + hint/error, wired to react-hook-form and screen readers. */
export function TextField({ id, label, hint, error, registration, ...inputProps }: Props) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...inputProps}
        {...registration}
      />
      {error ? (
        <p
          id={`${id}-error`}
          className="text-sm text-destructive motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1"
        >
          {error.message}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
