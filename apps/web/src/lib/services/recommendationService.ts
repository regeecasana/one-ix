import { HttpError } from "../errors";

const USAGE_VALUES = ["streaming", "uploading", "gaming", "work", "entertainment", "family"] as const;
const DEVICES_VALUES = ["light", "household", "creator-studio", "power-user"] as const;
const PRIORITY_VALUES = ["speed", "reliability", "upload", "flexibility", "value"] as const;

const USAGE_LABELS: Record<string, string> = {
  streaming: "livestreaming",
  uploading: "upload",
  gaming: "gaming",
  work: "remote work",
  entertainment: "entertainment",
  family: "family connectivity",
};

const PRIORITY_PHRASES: Record<string, string> = {
  speed: "the speed you need",
  reliability: "reliable connectivity",
  upload: "priority upload performance",
  flexibility: "the flexibility to switch anytime",
  value: "the best value for what you need",
};

function isValidUsage(usage: unknown): usage is string[] {
  return Array.isArray(usage) && usage.length > 0 && usage.every((u) => USAGE_VALUES.includes(u));
}

// A deterministic rules engine, not a model call -- see docs/architecture.md
// on why this stays a real (if simple) decision table.
export function recommendPlan(usage: unknown, devices: string, priority: string): { productId: string; reason: string } {
  if (!isValidUsage(usage)) throw new HttpError(400, "invalid_usage");
  if (!DEVICES_VALUES.includes(devices as (typeof DEVICES_VALUES)[number])) throw new HttpError(400, "invalid_devices");
  if (!PRIORITY_VALUES.includes(priority as (typeof PRIORITY_VALUES)[number])) throw new HttpError(400, "invalid_priority");

  const hasCreatorSignal = usage.some((u) => u === "streaming" || u === "uploading" || u === "gaming");
  const hasWorkSignal = usage.includes("work");
  const isHousehold = devices === "household" || devices === "power-user";

  let productId: string;
  if (hasCreatorSignal) {
    productId = "plan-creator";
  } else if (isHousehold && !hasWorkSignal) {
    productId = "plan-home-multi";
  } else if (hasWorkSignal) {
    productId = "plan-gosurf-xtra";
  } else {
    productId = "plan-gosurf799";
  }

  const labels = usage.map((u) => USAGE_LABELS[u]);
  const usagePhrase =
    labels.length <= 2 ? labels.join(" and ") : `${labels.slice(0, 2).join(", ")}, and more`;
  const devicesPhrase = isHousehold ? ", multiple connected devices," : "";
  const priorityPhrase = PRIORITY_PHRASES[priority] ?? "reliable connectivity";

  const reason = `Based on your ${usagePhrase} activity${devicesPhrase} this setup gives you ${priorityPhrase} wherever you create.`;

  return { productId, reason };
}
