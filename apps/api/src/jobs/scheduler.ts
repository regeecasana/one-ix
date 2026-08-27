import cron from "node-cron";
import { env } from "../env";
import { runCdpSweep } from "./cdpSweep";

// Converts an arbitrary millisecond interval into a cron expression.
// Assumes the interval evenly divides 60 (true for the documented demo
// defaults: 15s, 60s) -- node-cron's 6-field form adds a seconds slot.
function everyMsAsCron(intervalMs: number): string {
  const seconds = Math.max(1, Math.round(intervalMs / 1000));
  if (seconds % 60 === 0) return `*/${seconds / 60} * * * *`;
  return `*/${seconds} * * * * *`;
}

export function startBackgroundJobs(): void {
  cron.schedule(everyMsAsCron(env.abandonSweepIntervalMs), () => {
    runCdpSweep().catch((err) => console.error("[jobs] CDP sweep failed", err));
  });

  console.log(`[jobs] CDP sweep every ${env.abandonSweepIntervalMs}ms`);
}
