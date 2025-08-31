import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { HandlerEvent, HandlerResponse } from '@netlify/functions';
import { appRouter } from '../../server/trpc';
import { createContext } from '../../server/context';
import type { IncomingMessage } from 'http';
import { TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';

export const handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  console.log('Server Incoming Request Method:', event.httpMethod);
  console.log('Server Incoming Request URL:', event.path);
  console.log('Server Incoming Request Query:', event.queryStringParameters);
  console.log('Server Raw Request Body:', event.body);
  console.log('Server Content-Type Header:', event.headers['content-type'] || 'Not set');
  try {
    console.log('Server Parsed Request Body:', event.body ? JSON.parse(event.body) : null);
  } catch (parseError) {
    console.error('Server Body Parse Error:', parseError);
  }
  console.log('Server Incoming Request Headers:', event.headers);

  const queryString = event.queryStringParameters
    ? new URLSearchParams(event.queryStringParameters as Record<string, string>).toString()
    : '';
  const path = event.path.replace('/.netlify/functions/trpc', '/trpc');
  const url = `https://${event.headers.host || 'localhost:8888'}${path}${queryString ? `?${queryString}` : ''}`;

  const headers = Object.fromEntries(
    Object.entries(event.headers || {}).filter(([, value]) => value !== undefined)
  ) as Record<string, string>;

  const isLocalhost = headers['origin']?.includes('localhost');
  const allowedOrigin = isLocalhost
    ? headers['origin']
    : process.env.VITE_APP_URL || 'http://localhost:5173';

  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': allowedOrigin || 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    console.log('Body Sent to tRPC:', event.httpMethod !== 'GET' && event.body ? event.body : undefined);
    console.log('URL Sent to tRPC:', url);

    const request = new Request(url, {
      method: event.httpMethod,
      headers,
      body: event.httpMethod !== 'GET' && event.body ? event.body : undefined,
    });

    const response = await fetchRequestHandler({
      endpoint: '/trpc',
      req: request,
      router: appRouter,
      createContext: () => createContext({ req: { headers } as IncomingMessage }),
      onError: ({ error, path, input }) => {
        console.error(`tRPC error on path "${path}":`, error);
        console.log(`tRPC Input for ${path}:`, input);
      },
      batching: {
        enabled: true,
      },
      // Allow POST for all procedures, including queries
      allowMethodOverride: true,
      // Set CORS headers and ensure 200 for successful queries
      responseMeta: () => ({
        headers: corsHeaders,
        status: 200,
      }),
    });

    const responseBody = await response.text();
    console.log('tRPC Response:', responseBody);

    return {
      statusCode: response.status,
      headers: { ...Object.fromEntries(response.headers), ...corsHeaders },
      body: responseBody,
    };
  } catch (error: unknown) {
    console.error('Handler error:', error);
    const trpcError = error instanceof TRPCError ? error : new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      cause: error,
    });
    const statusCode = getHTTPStatusCodeFromError(trpcError);
    return {
      statusCode,
      headers: { 'content-type': 'application/json', ...corsHeaders },
      body: JSON.stringify([{
        error: {
          message: trpcError.message,
          code: trpcError.code,
          data: {
            code: trpcError.code,
            httpStatus: statusCode,
            stack: trpcError.stack,
            path: path.split('/trpc/')[1]?.split('?')[0],
          },
        },
      }]),
    };
  }
};