import { HttpError } from "../errors";

export type BuilderUsage = "streaming" | "work" | "gaming" | "everyday";
export type BuilderDevices = "just-phone" | "phone-laptop" | "household";

const USAGE_VALUES: BuilderUsage[] = ["streaming", "work", "gaming", "everyday"];
const DEVICES_VALUES: BuilderDevices[] = ["just-phone", "phone-laptop", "household"];

// A deterministic rules engine, not a model call -- see docs/architecture.md
// on why this stays a real (if simple) decision table rather than a
// simulated "AI" recommendation.
export function recommendPlan(usage: string, devices: string): { productId: string; reason: string } {
  if (!USAGE_VALUES.includes(usage as BuilderUsage)) throw new HttpError(400, "invalid_usage");
  if (!DEVICES_VALUES.includes(devices as BuilderDevices)) throw new HttpError(400, "invalid_devices");

  if (devices === "household") {
    return {
      productId: "plan-home-multi",
      reason:
        "You told us this setup covers your whole household, not just one device -- Home Multi-Device shares 150GB across up to 5 devices, built for exactly that.",
    };
  }

  if (usage === "streaming" || usage === "gaming") {
    return {
      productId: "plan-creator-pro",
      reason:
        "Since you picked content creation & livestreaming, Creator Pro gives you priority upload speed and 100GB so your streams never buffer.",
    };
  }

  if (usage === "work") {
    return {
      productId: "plan-work",
      reason:
        "You're mostly on work calls and video meetings -- Work & Call prioritizes HD video calls during work hours and gives you 30GB to cover it.",
    };
  }

  return {
    productId: "plan-starter",
    reason: "For everyday browsing, Starter covers unlimited calls & text plus 10GB data without paying for more than you need.",
  };
}
