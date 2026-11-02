import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QtyStepperProps {
  qty: number;
  onChange: (qty: number) => void;
  min?: number;
  className?: string;
}

export function QtyStepper({ qty, onChange, min = 1, className }: QtyStepperProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-card p-1",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(qty - 1)}
        disabled={qty <= min}
        className="flex size-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums">{qty}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(qty + 1)}
        className="flex size-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
