import type { NextFunction, Request, Response } from "express";
import { env } from "../env";

// Fail closed: an unconfigured INTERNAL_API_TOKEN rejects every request
// rather than accepting any token.
export function internalAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.header("X-Internal-Token");
  if (!env.internalApiToken || token !== env.internalApiToken) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}
