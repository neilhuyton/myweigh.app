import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "../../server/trpc";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";

const ALLOWED_ORIGINS = [
  process.env.VITE_APP_URL || "http://localhost:8888",
].filter(Boolean);

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin":
      origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const response = await fetchRequestHandler({
      endpoint: "/trpc",
      req,
      router: appRouter,
      createContext: () => createContext({ req }),
      batching: { enabled: true },
      allowMethodOverride: true,
      onError: ({ error }) => console.error("tRPC server error:", error),
    });

    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) =>
      headers.set(key, value),
    );

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (cause) {
    const error =
      cause instanceof TRPCError
        ? cause
        : new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unexpected server error",
            cause,
          });

    const statusCode = getHTTPStatusCodeFromError(error);

    const body = JSON.stringify({
      error: {
        message: error.message,
        code: error.code,
        data: {
          code: error.code,
          httpStatus: statusCode,
          path:
            new URL(req.url).pathname.split("/trpc/")[1]?.split("?")[0] || "",
          ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
        },
      },
    });

    const errorHeaders = new Headers({
      "Content-Type": "application/json",
      ...corsHeaders,
    });

    return new Response(body, { status: statusCode, headers: errorHeaders });
  }
}
