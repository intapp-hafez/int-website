export * from "@tanstack/react-router";

export function createServerFn() {
  let validatorFn: any = (d: any) => d;
  const builder = {
    validator: (v: any) => { validatorFn = v; return builder; },
    inputValidator: (v: any) => { validatorFn = v; return builder; },
    middleware: () => builder, 
    handler: (h: any) => {
      return async (input: any) => {
        // TanStack Start server functions are called as fn({ data: ... }).
        // Unwrap the .data property before running the validator so the
        // handler always receives { data: validatedPayload } — not double-wrapped.
        const raw = input && typeof input === "object" && "data" in input ? input.data : input;
        return await h({ data: validatorFn(raw) });
      }
    }
  };
  return builder;
}

export function createMiddleware() {
  const builder = {
    middleware: () => builder,
    server: () => builder,
    client: () => builder
  };
  return builder;
}

export function useServerFn<T>(fn: T): T {
  return fn;
}

// Mock server context functions for SPA
export function getRequest() {
  return new Request("http://localhost");
}

export function getRequestHeader(name: string) {
  return null;
}
