// App-wide state: the menu/settings from the API and the cart (saved in localStorage).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Item, Settings } from "../shared/types";
import { api } from "./api";

export interface CartLine {
  qty: number;
  note: string;
}
type Cart = Record<string, CartLine>;

interface Store {
  items: Item[] | null;
  settings: Settings | null;
  loadError: string | null;
  reload: () => void;
  cart: Cart;
  setQty: (itemId: string, qty: number) => void;
  add: (itemId: string) => void;
  setNote: (itemId: string, note: string) => void;
  clearCart: () => void;
  /** Cart lines joined with item data, skipping items no longer on the menu. */
  lines: { item: Item; qty: number; note: string }[];
  count: number;
  totalCents: number;
}

const Ctx = createContext<Store | null>(null);
const CART_KEY = "bxb-cart-v1";

function loadCart(): Cart {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as Cart) : {};
  } catch {
    return {};
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart>(loadCart);

  const reload = useCallback(() => {
    setLoadError(null);
    api
      .menu()
      .then((m) => {
        setItems(m.items);
        setSettings(m.settings);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  useEffect(reload, [reload]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* private mode etc. */
    }
  }, [cart]);

  const maxFor = useCallback(
    (itemId: string) => {
      const item = items?.find((i) => i.id === itemId);
      return item?.stock ?? 50;
    },
    [items],
  );

  const setQty = useCallback(
    (itemId: string, qty: number) =>
      setCart((c) => {
        const next = { ...c };
        const q = Math.max(0, Math.min(qty, maxFor(itemId)));
        if (q === 0) delete next[itemId];
        else next[itemId] = { note: c[itemId]?.note ?? "", qty: q };
        return next;
      }),
    [maxFor],
  );

  const value = useMemo<Store>(() => {
    const lines = items
      ? Object.entries(cart).flatMap(([id, l]) => {
          const item = items.find((i) => i.id === id);
          return item ? [{ item, qty: l.qty, note: l.note }] : [];
        })
      : [];
    lines.sort((a, b) => a.item.sort - b.item.sort);
    return {
      items,
      settings,
      loadError,
      reload,
      cart,
      setQty,
      add: (id) => setQty(id, (cart[id]?.qty ?? 0) + 1),
      setNote: (id, note) =>
        setCart((c) => (c[id] ? { ...c, [id]: { ...c[id], note: note.slice(0, 200) } } : c)),
      clearCart: () => setCart({}),
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      totalCents: lines.reduce((n, l) => n + l.qty * l.item.priceCents, 0),
    };
  }, [items, settings, loadError, reload, cart, setQty]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
