import { createFileRoute } from "@tanstack/react-router";
import { verifiedRequestUser } from "@/lib/session-security.server";

export const Route = createFileRoute("/api/public/security/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // /api/public bypasses site auth: explicitly authenticate every caller.
        const user = await verifiedRequestUser(request);
        return Response.json(user ? { authenticated: true } : { authenticated: false }, {
          status: user ? 200 : 401,
          headers: { "cache-control": "no-store, private", "x-content-type-options": "nosniff" },
        });
      },
    },
  },
});