import Stripe from "stripe";
import { env } from "@/shared/lib/env";
import { InfrastructureError } from "@/shared/lib/errors";

let cached: Stripe | undefined;

/** Lazy singleton — env is validated at first use, not at import time (build safety). */
export function stripe(): Stripe {
  if (cached === undefined) {
    const key = env().STRIPE_SECRET_KEY;
    if (key === undefined) {
      throw new InfrastructureError("STRIPE_SECRET_KEY is not configured");
    }
    cached = new Stripe(key);
  }
  return cached;
}
