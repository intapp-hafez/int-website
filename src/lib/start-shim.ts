export * from "@tanstack/react-router";

export function createServerFn() {
  let validatorFn: any = (d: any) => d;
  const builder = {
    validator: (v: any) => { validatorFn = v; return builder; },
    inputValidator: (v: any) => { validatorFn = v; return builder; },
    middleware: () => builder, 
    handler: (h: any) => {
      return async (input: any) => {
        // Run handler directly in the browser
        return await h({ data: validatorFn(input) });
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
