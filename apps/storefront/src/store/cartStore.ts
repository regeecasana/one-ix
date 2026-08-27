import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cart, CartItem, Order } from "@oneix/shared";
import * as api from "../lib/api";
import type { Attribution } from "../lib/api";

export interface LastOrder {
  order: Order;
  items: CartItem[];
}

interface CartState {
  // Persisted -- survives a refresh, and is how the "Continue My Setup"
  // email link hands control back to a returning visitor.
  cartId: string | null;
  pendingAttribution: Attribution | null;
  lastOrder: LastOrder | null;

  // Not persisted -- always re-fetched, so a stale local copy never masks
  // server-side changes (e.g. the CDP sweep nudging this cart while a tab
  // sits open).
  cart: Cart | null;
  loading: boolean;

  refresh: () => Promise<void>;
  captureAttribution: (attribution: Attribution) => void;
  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  setRecommendationReason: (reason: string) => Promise<void>;
  restoreCart: (cartId: string) => Promise<void>;
  requestOtp: (mobileNumber: string) => Promise<void>;
  verifyOtp: (params: { email: string; mobileNumber: string; otp: string; name?: string }) => Promise<void>;
  completeActivation: () => Promise<Order>;
  clearLastOrder: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: null,
      pendingAttribution: null,
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

      captureAttribution: (attribution) => {
        if (!attribution.utmSource && !attribution.utmCampaign && !attribution.utmContent) return;
        if (get().cartId) return; // only matters before a setup exists
        set({ pendingAttribution: attribution });
      },

      addItem: async (productId, quantity) => {
        let cartId = get().cartId;
        if (!cartId) {
          const created = await api.createCart(get().pendingAttribution ?? undefined);
          cartId = created.id;
          set({ cartId, cart: created, pendingAttribution: null });
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

      setRecommendationReason: async (reason) => {
        const { cartId } = get();
        if (!cartId) return;
        const cart = await api.updateCart(cartId, { recommendationReason: reason });
        set({ cart });
      },

      restoreCart: async (cartId) => {
        const cart = await api.getCart(cartId);
        set({ cartId, cart });
      },

      requestOtp: async (mobileNumber) => {
        const { cartId } = get();
        if (!cartId) throw new Error("no_cart");
        await api.requestOtp(cartId, mobileNumber);
      },

      verifyOtp: async (params) => {
        const { cartId } = get();
        if (!cartId) throw new Error("no_cart");
        const cart = await api.verifyOtp(cartId, params);
        set({ cart });
      },

      completeActivation: async () => {
        const { cartId, cart } = get();
        if (!cartId || !cart) throw new Error("no_cart");
        const order = await api.completeActivation(cartId);
        set({
          lastOrder: { order, items: cart.items },
          cart: null,
          cartId: null,
        });
        return order;
      },

      clearLastOrder: () => set({ lastOrder: null }),
    }),
    {
      name: "oneix-cart",
      partialize: (state) => ({
        cartId: state.cartId,
        pendingAttribution: state.pendingAttribution,
        lastOrder: state.lastOrder,
      }),
    }
  )
);

export function cartItemCount(cart: Cart | null): number {
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}
