import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const securityMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { getRequest, setResponseHeader } = await import("@tanstack/react-start/server");
  const { isSameOriginRequest } = await import("./lib/request-security");
  const request = getRequest();
  setResponseHeader("Cache-Control", "no-store, private");
  if (!isSameOriginRequest(request)) throw new Response("Forbidden", { status: 403 });
  if (request.headers.has("authorization")) {
    const { verifiedRequestUser } = await import("./lib/session-security.server");
    if (!(await verifiedRequestUser(request))) throw new Response("Unauthorized", { status: 401 });
  }
  return next();
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth, securityMiddleware],
  requestMiddleware: [errorMiddleware],
}));
