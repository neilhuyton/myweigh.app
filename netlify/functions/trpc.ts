// netlify/functions/trpc.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { HandlerEvent, HandlerResponse } from "@netlify/functions";
import { appRouter } from "../../server/trpc";
import prisma from "../../server/prisma";
import jwt from "jsonwebtoken"; // Add this import

export const handler = async (
  event: HandlerEvent
): Promise<HandlerResponse> => {
  const queryString = event.queryStringParameters
    ? new URLSearchParams(
        event.queryStringParameters as Record<string, string>
      ).toString()
    : "";
  const path = event.path.replace("/.netlify/functions/trpc", "/trpc");
  const url = `https://${event.headers.host || "localhost:8888"}${path}${
    queryString ? `?${queryString}` : ""
  }`;

  const headers = Object.fromEntries(
    Object.entries(event.headers || {}).filter(
      ([, value]) => value !== undefined
    )
  ) as Record<string, string>;

  const isLocalhost = headers["origin"]?.includes("localhost");
  const allowedOrigin = isLocalhost
    ? headers["origin"]
    : process.env.VITE_APP_URL || "http://localhost:5173";

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": allowedOrigin || "http://localhost:5173",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    let userId: string | undefined;
    const authHeader = headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      console.log("Received token:", token); // Log the token
      try {
        const decoded = jwt.verify(
          token,
          "c788ff0f1933f20cc5e9fa15646a97c5d13eb9dea525cb83032919e4deeaab37"
        ) as {
          userId: string;
          email: string;
          iat: number;
          exp: number;
        };
        userId = decoded.userId;
      } catch (error) {
        console.error("JWT verification failed:", error);
        // Don't throw here; let protected routes handle unauthorized errors
      }
    }

    const response = await fetchRequestHandler({
      endpoint: "/trpc",
      req: new Request(url, {
        method: event.httpMethod,
        headers,
        body: event.httpMethod !== "GET" && event.body ? event.body : undefined,
      }),
      router: appRouter,
      createContext: () => ({ prisma, userId }), // Pass verified userId
      onError: ({ error, path }) => {
        console.error(`tRPC error on path "${path}":`, error);
      },
    });

    const responseHeaders: Record<string, string> = Object.fromEntries(
      response.headers
    );

    return {
      statusCode: response.status,
      headers: { ...responseHeaders, ...corsHeaders },
      body: await response.text(),
    };
  } catch (error) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json", ...corsHeaders },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
