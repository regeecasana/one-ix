import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cart, CartItem, Order } from "@oneix/shared";
import * as api from "../lib/api";

export interface LastOrder {
  order: Order;
  items: CartItem[];
}

interface CartState {
  // Persisted -- survives a refresh, and is how a coupon email's
  // /cart/:cartId?coupon=... link hands control back to a returning visitor.
  cartId: string | null;
  pendingCoupon: string | null;
  lastOrder: LastOrder | null;

  // Not persisted -- always re-fetched, so a stale local copy never masks
  // server-side changes (e.g. an agent issuing a coupon while this tab sits open).
  cart: Cart | null;
  loading: boolean;

  refresh: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  restoreCart: (cartId: string, coupon: string | null) => Promise<void>;
  startCheckout: (email: string, name?: string) => Promise<void>;
  completeCheckout: (couponCode?: string) => Promise<Order>;
  clearPendingCoupon: () => void;
  clearLastOrder: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: null,
      pendingCoupon: null,
      lastOrder: null,
      cart: null,
      loading: false,

      refresh: async () => {
        const { cartId } = get();
        if (!cartId) {
          set({ cart: null });
          return;
        }
        set({ loading: true });
        try {
          const cart = await api.getCart(cartId);
          set({ cart, loading: false });
        } catch {
          // Gone or converted elsewhere -- drop the pointer rather than
          // keep pointing at a cart that no longer resolves.
          set({ cart: null, cartId: null, loading: false });
        }
      },

      addItem: async (productId, quantity) => {
        let cartId = get().cartId;
        if (!cartId) {
          const created = await api.createCart();
          cartId = created.id;
          set({ cartId, cart: created });
        }
        const cart = await api.addCartItem(cartId, productId, quantity);
        set({ cart });
      },

      removeItem: async (itemId) => {
        const { cartId } = get();
        if (!cartId) return;
        const cart = await api.removeCartItem(cartId, itemId);
        set({ cart });
      },

      restoreCart: async (cartId, coupon) => {
        const cart = await api.getCart(cartId);
        set({ cartId, cart, pendingCoupon: coupon });
      },

      startCheckout: async (email, name) => {
        const { cartId } = get();
        if (!cartId) throw new Error("no_cart");
        const cart = await api.checkoutStart(cartId, email, name);
        set({ cart });
      },

      completeCheckout: async (couponCode) => {
        const { cartId, cart } = get();
        if (!cartId || !cart) throw new Error("no_cart");
        const order = await api.checkoutComplete(cartId, couponCode);
        set({
          lastOrder: { order, items: cart.items },
          cart: null,
          cartId: null,
          pendingCoupon: null,
        });
        return order;
      },

      clearPendingCoupon: () => set({ pendingCoupon: null }),
      clearLastOrder: () => set({ lastOrder: null }),
    }),
    {
      name: "oneix-cart",
      partialize: (state) => ({
        cartId: state.cartId,
        pendingCoupon: state.pendingCoupon,
        lastOrder: state.lastOrder,
      }),
    }
  )
);

export function cartItemCount(cart: Cart | null): number {
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}
