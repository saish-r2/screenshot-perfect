import type { Diet } from "@/data/types";
import { cn } from "@/lib/utils";

/**
 * Indian food-labelling mark: green square with a circle for veg,
 * brown/red square with a triangle for non-veg.
 */
export function VegMark({ diet, className }: { diet: Diet; className?: string }) {
  const veg = diet === "veg";
  return (
    <span
      title={veg ? "Vegetarian" : "Non-vegetarian"}
      aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] border-2",
        veg ? "border-veg" : "border-nonveg",
        className,
      )}
    >
      {veg ? (
        <span className="size-1.5 rounded-full bg-veg" />
      ) : (
        <span
          className="size-2 bg-nonveg [clip-path:polygon(50%_0,100%_100%,0_100%)]"
        />
      )}
    </span>
  );
}
