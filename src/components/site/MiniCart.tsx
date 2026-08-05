import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingCart, Trash2, Minus, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";

export function MiniCart() {
  const { items, count, subtotal, currency, remove, setQty } = useCart();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const listRef = useRef<HTMLDivElement>(null);

  const onListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const focusables = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])') ?? []
    );
    if (focusables.length === 0) return;
    const idx = focusables.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusables[(idx + 1 + focusables.length) % focusables.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusables[(idx - 1 + focusables.length) % focusables.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      focusables[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      focusables[focusables.length - 1]?.focus();
    }
  };

  const cartLabel = ar
    ? count > 0 ? `سلة العروض (${count} عنصر)` : "سلة العروض فارغة"
    : count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart is empty";

  return (
    <Popover>
      <PopoverTrigger
        aria-label={cartLabel}
        aria-haspopup="dialog"
        className="relative inline-flex h-7 w-7 items-center justify-center hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded transition-colors"
      >
        <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
        {count > 0 && (
          <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 text-[9px] font-bold rounded-full h-3.5 min-w-3.5 px-1 inline-flex items-center justify-center bg-accent text-accent-foreground border border-accent shadow-sm">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        role="dialog"
        aria-label={ar ? "سلة العروض" : "Quote cart"}
        className="w-80 p-0 text-foreground"
        dir={ar ? "rtl" : "ltr"}
        onKeyDown={onListKeyDown}
      >
        <div ref={listRef}>
        <div className="p-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold">{ar ? "سلة العروض" : "Quote Cart"}</h2>
          <div className="text-xs text-muted-foreground" aria-live="polite">{count} {ar ? "عنصر" : "items"}</div>
        </div>
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {ar ? "السلة فارغة" : "Your cart is empty"}
          </div>
        ) : (
          <>
            <ul className="max-h-72 overflow-y-auto divide-y" aria-label={ar ? "عناصر السلة" : "Cart items"}>
              {items.map(i => (
                <li key={i.id} className="p-3 flex gap-2 items-start">
                  <img src={i.image_url} alt="" className="h-12 w-12 rounded object-cover bg-muted shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium line-clamp-2">{ar ? i.name_ar : i.name_en}</div>
                    <div className="mt-1 flex items-center gap-1.5" role="group" aria-label={ar ? `الكمية لـ ${i.name_ar}` : `Quantity for ${i.name_en}`}>
                      <button
                        type="button"
                        onClick={() => setQty(i.id, i.quantity - 1)}
                        aria-label={ar ? "إنقاص الكمية" : "Decrease quantity"}
                        className="h-6 w-6 rounded border text-xs hover:bg-muted inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Minus className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <span className="text-xs w-6 text-center" aria-live="polite" aria-label={ar ? `الكمية ${i.quantity}` : `Quantity ${i.quantity}`}>{i.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQty(i.id, i.quantity + 1)}
                        aria-label={ar ? "زيادة الكمية" : "Increase quantity"}
                        className="h-6 w-6 rounded border text-xs hover:bg-muted inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(i.id)}
                        aria-label={ar ? `إزالة ${i.name_ar}` : `Remove ${i.name_en}`}
                        className="ms-auto h-6 w-6 inline-flex items-center justify-center rounded hover:bg-destructive/10 text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs font-semibold shrink-0">
                    {i.price != null ? `${(i.price * i.quantity).toFixed(2)} ${i.currency}` : "—"}
                  </div>
                </li>
              ))}
            </ul>
            <div className="p-3 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{ar ? "الإجمالي" : "Subtotal"}</span>
                <span className="font-bold" aria-live="polite">{subtotal.toFixed(2)} {currency}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm"><Link to="/cart">{ar ? "عرض السلة" : "View cart"}</Link></Button>
                <Button asChild size="sm"><Link to="/cart">{ar ? "طلب عرض سعر" : "Request quote"}</Link></Button>
              </div>
            </div>
          </>
        )}
        </div>
      </PopoverContent>
    </Popover>
  );
}