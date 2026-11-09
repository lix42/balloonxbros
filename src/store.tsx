// App-wide state: the menu/settings (server-rendered first, refreshed from the
// API) and the cart (saved in localStorage, so it is read only after hydration).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Item, MenuResponse, Settings } from "../shared/types";
import { api } from "./api";

export interface CartLine {
  qty: number;
  note: string;
}
type Cart = Record<string, CartLine>;

interface Store {
  items: Item[];
  settings: Settings;
  loadError: string | null;
  reload: () => void;
  cart: Cart;
  /** False until the saved cart has been read from localStorage after mount. */
  cartReady: boolean;
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
    const cart: unknown = raw ? JSON.parse(raw) : null;
    return cart && typeof cart === "object" && !Array.isArray(cart) ? (cart as Cart) : {};
  } catch {
    return {};
  }
}

export function StoreProvider({ initialMenu, children }: { initialMenu: MenuResponse; children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(initialMenu.items);
  const [settings, setSettings] = useState<Settings>(initialMenu.settings);
  const [loadError, setLoadError] = useState<string | null>(null);
  // The server has no localStorage: start empty (as the server rendered) and
  // load the saved cart once mounted. Saving waits until then, so the empty
  // first render never overwrites the saved cart.
  const [cart, setCart] = useState<Cart>({});
  const [cartLoaded, setCartLoaded] = useState(false);

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

  useEffect(() => {
    setCart(loadCart());
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* private mode etc. */
    }
  }, [cart, cartLoaded]);

  const maxFor = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
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
    const lines = Object.entries(cart).flatMap(([id, l]) => {
      const item = items.find((i) => i.id === id);
      return item ? [{ item, qty: l.qty, note: l.note }] : [];
    });
    lines.sort((a, b) => a.item.sort - b.item.sort);
    return {
      items,
      settings,
      loadError,
      reload,
      cart,
      cartReady: cartLoaded,
      setQty,
      add: (id) => setQty(id, (cart[id]?.qty ?? 0) + 1),
      setNote: (id, note) =>
        setCart((c) => (c[id] ? { ...c, [id]: { ...c[id], note: note.slice(0, 200) } } : c)),
      clearCart: () => setCart({}),
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      totalCents: lines.reduce((n, l) => n + l.qty * l.item.priceCents, 0),
    };
  }, [items, settings, loadError, reload, cart, cartLoaded, setQty]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
