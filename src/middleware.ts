import { clerkMiddleware } from "@clerk/nextjs/server";

// Layer 1 of the multi-layer authorization: Clerk session handling on every matched
// request. Route protection matchers land with the identity module; authorization
// decisions NEVER rely on middleware alone (defense in depth — every deeper layer
// re-checks via hasPermission()).
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next internals and static assets; always run for API routes.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
