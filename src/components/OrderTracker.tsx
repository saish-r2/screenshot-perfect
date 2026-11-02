import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { Order } from "@/data/types";
import { ORDER_STEPS, getOrderStepIndex, orderStepTimes } from "@/lib/order";
import { cn } from "@/lib/utils";

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

/** Live progress tracker: placed → accepted → preparing → ready. */
export function OrderTracker({ order }: { order: Order }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const current = getOrderStepIndex(order.placedAt, now);
  const times = orderStepTimes(order);

  return (
    <ol className="ml-1">
      {ORDER_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const reached = done || active;
        return (
          <li key={step.id} className="relative flex gap-4 pb-7 last:pb-0">
            {i < ORDER_STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5",
                  i < current ? "bg-veg" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                done && "border-veg bg-veg text-veg-foreground",
                active && "border-accent bg-accent text-accent-foreground",
                !reached && "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <span className={cn("size-2 rounded-full bg-current", active && "animate-pulse")} />
              )}
            </span>
            <div className="pt-0.5">
              <p className={cn("text-sm font-bold", reached ? "text-foreground" : "text-muted-foreground")}>
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {done
                  ? `Done · ${formatTime(times[i] ?? order.placedAt)}`
                  : active
                    ? step.hint
                    : `Expected around ${formatTime(times[i] ?? order.placedAt + step.offsetMs)}`}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
