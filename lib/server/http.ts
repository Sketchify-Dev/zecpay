// lib/server/http.ts
// Tiny JSON Response helper used by the route handlers. Avoids depending on
// Response.json typing and keeps the content-type in one place. Note: response
// payloads use string amounts (never bigint), so JSON.stringify is always safe.

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
