import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cart, CartItem, Order } from "@oneix/shared";
import * as api from "../lib/api";
import type { Attribution, BufferedEvent } from "../lib/api";

export interface LastOrder {
  order: Order;
  items: CartItem[];
}

interface CartState {
  // Persisted -- survives a refresh.
  cartId: string | null;
  pendingAttribution: Attribution | null;
  lastOrder: LastOrder | null;
  customerId: string | null;
  customerEmail: string | null;
  // Every interaction logged before the 30s email popup resolves an
  // identity -- flushed atomically into the customer's ticket on identify().
  pendingEvents: BufferedEvent[];
  emailPromptDismissed: boolean;

  // Not persisted -- always re-fetched, so a stale local copy never masks
  // server-side changes.
  cart: Cart | null;
  loading: boolean;

  refresh: () => Promise<void>;
  captureAttribution: (attribution: Attribution) => void;
  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  setRecommendationReason: (reason: string) => Promise<void>;
  restoreCart: (cartId: string) => Promise<void>;
  logEvent: (type: string, detail: string) => void;
  identify: (email: string, name?: string) => Promise<void>;
  dismissEmailPrompt: () => void;
  completeActivation: (voucherCode?: string) => Promise<Order>;
  clearLastOrder: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: null,
      pendingAttribution: null,
      lastOrder: null,
      customerId: null,
      customerEmail: null,
      pendingEvents: [],
      emailPromptDismissed: false,
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

          // The 30s popup often resolves an identity before any cart
          // exists yet -- if so, this brand-new cart was never linked to
          // that customer. Link it retroactively (idempotent: the ticket
          // already exists, this just attaches the cart).
          const { customerId, customerEmail } = get();
          if (customerId && customerEmail) {
            await api.identifyCustomer({ email: customerEmail, cartId });
          }
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

      // Fire-and-forget: an interaction event should never block or break
      // the UI it's describing. Before an identity exists, buffer locally
      // (persisted) and flush on identify().
      logEvent: (type, detail) => {
        const { customerId } = get();
        if (customerId) {
          api.logInteraction(customerId, type, detail).catch(() => {});
        } else {
          set((s) => ({ pendingEvents: [...s.pendingEvents, { type, detail }] }));
        }
      },

      identify: async (email, name) => {
        const { cartId, pendingEvents } = get();
        const { customerId } = await api.identifyCustomer({
          email,
          name,
          cartId: cartId ?? undefined,
          bufferedEvents: pendingEvents,
        });
        set({ customerId, customerEmail: email, pendingEvents: [], emailPromptDismissed: true });
      },

      dismissEmailPrompt: () => set({ emailPromptDismissed: true }),

      completeActivation: async (voucherCode) => {
        const { cartId, cart } = get();
        if (!cartId || !cart) throw new Error("no_cart");
        const order = await api.completeActivation(cartId, voucherCode);
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
        customerId: state.customerId,
        customerEmail: state.customerEmail,
        pendingEvents: state.pendingEvents,
        emailPromptDismissed: state.emailPromptDismissed,
      }),
    }
  )
);

export function cartItemCount(cart: Cart | null): number {
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}
