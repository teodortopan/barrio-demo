import { demoGetBody } from "@/lib/demo/api-seed";
import { DEMO_NOTICE } from "@/lib/demo";

export const DEMO_MUTATION_EVENT = "barrio-demo:mutation";

declare global {
  interface Window {
    __barrioDemoFetchInstalled?: boolean;
  }
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

if (typeof window !== "undefined" && !window.__barrioDemoFetchInstalled) {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const request = input instanceof Request ? input : null;
    const rawUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : request?.url || "";
    const url = new URL(rawUrl, window.location.origin);

    if (!url.pathname.startsWith("/api/")) {
      return originalFetch(input, init);
    }

    const method = (init?.method || request?.method || "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      window.dispatchEvent(new CustomEvent(DEMO_MUTATION_EVENT));
      return jsonResponse({ demo: true, error: DEMO_NOTICE, message: DEMO_NOTICE }, 403);
    }

    const body = demoGetBody(url.pathname, url.searchParams);
    if (body) return jsonResponse(body);

    return jsonResponse(
      { demo: true, error: "Endpoint no disponible en modo demostración" },
      404
    );
  };

  window.__barrioDemoFetchInstalled = true;
}

export {};
