import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, CircleCheck, Pencil, Plus, RotateCcw, Soup, Trash2, TriangleAlert } from "lucide-react";
import type { Diet, MenuItem } from "@/data/types";
import { FOOD_IMAGES, MENU_CATEGORIES } from "@/data/menu";
import { listOutlets } from "@/data/outlets";
import { formatINR } from "@/lib/format";
import {
  deleteMenuItem,
  hydrateStore,
  newMenuItemId,
  resetMenuToDemo,
  setItemAvailability,
  upsertMenuItem,
  useStore,
} from "@/lib/store";
import { FoodImage } from "@/components/FoodImage";
import { VegMark } from "@/components/VegMark";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Menu admin — Tales of Hyderabad" },
      {
        name: "description",
        content:
          "Demo admin for the Tales of Hyderabad menu: add or edit items, set per-outlet availability and restore the demo menu.",
      },
      { property: "og:title", content: "Menu admin — Tales of Hyderabad" },
      {
        property: "og:description",
        content: "Demo admin: manage the shared Tales of Hyderabad menu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Menu admin — Tales of Hyderabad" },
      { name: "twitter:description", content: "Demo admin: manage the shared Tales of Hyderabad menu." },
    ],
  }),
  component: AdminPage,
});

interface MenuForm {
  id: string | null; // null = adding
  name: string;
  description: string;
  category: string;
  price: string;
  diet: Diet;
  image: string;
}

const EMPTY_FORM: MenuForm = {
  id: null,
  name: "",
  description: "",
  category: "Biryani",
  price: "",
  diet: "veg",
  image: "",
};

const inputClass =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-destructive">{message}</p>;
}

function AdminPage() {
  const store = useStore();
  const [form, setForm] = useState<MenuForm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    hydrateStore();
  }, []);

  const outlets = listOutlets();
  const items = store.menuItems;

  const startAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setBanner(null);
  };

  const startEdit = (item: MenuItem) => {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      price: String(item.basePrice),
      diet: item.diet,
      image: item.image,
    });
    setErrors({});
    setBanner(null);
  };

  const saveItem = () => {
    if (!form) return;
    const name = form.name.trim();
    const description = form.description.trim();
    const price = Number(form.price);
    const e: Record<string, string> = {};
    if (name.length < 3) e.name = "Give the item a name (at least 3 characters).";
    if (description.length < 10) e.description = "Add a short description (at least 10 characters).";
    if (!(MENU_CATEGORIES as readonly string[]).includes(form.category)) {
      e.category = "Pick a category.";
    }
    if (!Number.isFinite(price) || price <= 0) e.price = "Enter a price in rupees, e.g. 329.";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setBanner({ kind: "error", text: "Please fix the highlighted fields." });
      return;
    }
    const existing = form.id ? items.find((i) => i.id === form.id) : null;
    if (existing) {
      upsertMenuItem({
        ...existing,
        name,
        description,
        category: form.category,
        basePrice: Math.round(price),
        diet: form.diet,
        image: form.image,
      });
      setBanner({ kind: "success", text: `${name} updated.` });
    } else {
      upsertMenuItem({
        id: newMenuItemId(name),
        name,
        description,
        category: form.category,
        basePrice: Math.round(price),
        diet: form.diet,
        allergens: [],
        image: form.image,
        availableAt: outlets.map((o) => o.id),
        portions: [],
        spiceLevels: [],
        addOns: [],
      });
      setBanner({ kind: "success", text: `${name} added to the menu.` });
    }
    setForm(null);
    setErrors({});
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
            Central menu admin · demo
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
            Manage the shared menu
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Changes appear immediately in the customer menu for every outlet.
          </p>
        </div>
        {!form && (
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Add menu item
          </button>
        )}
      </div>

      {banner && (
        <div
          aria-live="polite"
          className={cn(
            "mt-5 flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold",
            banner.kind === "success"
              ? "border-veg/40 bg-veg/10 text-foreground"
              : "border-destructive/40 bg-destructive/5 text-destructive",
          )}
        >
          {banner.kind === "success" ? (
            <CircleCheck className="size-4 shrink-0 text-veg" aria-hidden />
          ) : (
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
          )}
          {banner.text}
        </div>
      )}

      {form && (
        <section aria-labelledby="item-form-title" className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 id="item-form-title" className="font-display text-lg font-semibold">
            {form.id ? `Edit “${form.name || "item"}”` : "Add a menu item"}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ad-name" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Name
              </label>
              <input
                id="ad-name"
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Chicken 65 Biryani"
              />
              <FieldError message={errors.name} />
            </div>
            <div>
              <label htmlFor="ad-category" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Category
              </label>
              <select
                id="ad-category"
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {MENU_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <FieldError message={errors.category} />
            </div>
            <div>
              <label htmlFor="ad-price" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Price (₹, incl. 5% GST)
              </label>
              <input
                id="ad-price"
                className={inputClass}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d]/g, "") })}
                placeholder="329"
                inputMode="numeric"
              />
              <FieldError message={errors.price} />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Food label
              </p>
              <div className="flex gap-2">
                {(["veg", "nonveg"] as Diet[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={form.diet === d}
                    onClick={() => setForm({ ...form, diet: d })}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors",
                      form.diet === d ? "border-primary bg-primary/5" : "border-border hover:border-accent",
                    )}
                  >
                    <VegMark diet={d} />
                    {d === "veg" ? "Veg" : "Non-veg"}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ad-description" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Description
              </label>
              <textarea
                id="ad-description"
                rows={2}
                className={cn(inputClass, "resize-none")}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Slow-cooked with saffron, served with salan and raita."
              />
              <FieldError message={errors.description} />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Photo <span className="font-normal normal-case">(pick a demo food photo)</span>
              </p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-9">
                <button
                  type="button"
                  aria-pressed={form.image === ""}
                  title="No photo"
                  onClick={() => setForm({ ...form, image: "" })}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl border transition-colors",
                    form.image === "" ? "border-accent ring-1 ring-accent" : "border-border hover:border-accent",
                  )}
                >
                  <Soup className="size-5 text-muted-foreground" aria-hidden />
                </button>
                {FOOD_IMAGES.map((f, i) => (
                  <button
                    key={`${f.src}-${i}`}
                    type="button"
                    aria-pressed={form.image === f.src}
                    title={f.label}
                    onClick={() => setForm({ ...form, image: f.src })}
                    className={cn(
                      "aspect-square overflow-hidden rounded-xl border transition-colors",
                      form.image === f.src ? "border-accent ring-1 ring-accent" : "border-border hover:border-accent",
                    )}
                  >
                    <FoodImage src={f.src} alt={f.label} className="h-full w-full" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setForm(null);
                setErrors({});
              }}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-accent"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveItem}
              className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {form.id ? "Save changes" : "Add item"}
            </button>
          </div>
        </section>
      )}

      {MENU_CATEGORIES.map((cat) => {
        const group = items.filter((i) => i.category === cat);
        return (
          <section key={cat} className="mt-8">
            <h2 className="font-display text-xl font-semibold">{cat}</h2>
            {group.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No items in {cat} yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {group.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-start"
                  >
                    <FoodImage src={item.image} alt={item.name} className="size-16 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <VegMark diet={item.diet} />
                        <h3 className="font-semibold">{item.name}</h3>
                        <span className="text-sm font-bold tabular-nums">{formatINR(item.basePrice)}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{item.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                          Available at
                        </span>
                        {outlets.map((o) => {
                          const on = item.availableAt.includes(o.id);
                          return (
                            <button
                              key={o.id}
                              type="button"
                              aria-pressed={on}
                              onClick={() => setItemAvailability(item.id, o.id, !on)}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                                on
                                  ? "border-veg bg-veg text-veg-foreground"
                                  : "border-border text-muted-foreground hover:border-accent",
                              )}
                            >
                              {on && <Check className="size-3" aria-hidden />}
                              {o.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {confirmDeleteId === item.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              deleteMenuItem(item.id);
                              setConfirmDeleteId(null);
                              setBanner({ kind: "success", text: `${item.name} deleted.` });
                            }}
                            className="rounded-full bg-destructive px-3.5 py-2 text-xs font-bold text-destructive-foreground transition-colors hover:bg-destructive/90"
                          >
                            Yes, delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-full border border-border px-3.5 py-2 text-xs font-semibold transition-colors hover:border-accent"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-semibold transition-colors hover:border-accent"
                          >
                            <Pencil className="size-3.5" aria-hidden />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            aria-label={`Delete ${item.name}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3.5 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/5"
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Demo data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Restore the original demo menu — every admin edit is discarded.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2.5 text-sm font-bold text-destructive transition-colors hover:bg-destructive/5"
        >
          <RotateCcw className="size-4" aria-hidden />
          Reset to demo menu
        </button>
      </div>

      {confirmReset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
              <div>
                <h3 id="reset-title" className="font-display text-lg font-semibold">
                  Reset to the demo menu?
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  All menu changes — added, edited or deleted items and availability — go back to
                  the original demo data.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetMenuToDemo();
                  setConfirmReset(false);
                  setBanner({ kind: "success", text: "Menu reset to the demo data." });
                }}
                className="rounded-full bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                Reset menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
