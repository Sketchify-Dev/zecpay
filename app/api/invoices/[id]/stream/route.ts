// app/api/invoices/[id]/stream/route.ts
// Server-Sent Events: push invoice status changes until it settles or expires.
// Built on Web Streams so it stays framework-version stable. Verify behavior
// under Next 16 cacheComponents when the dev server is available.
import { reconcileInvoice } from "@/lib/server/payments";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let timer: ReturnType<typeof setInterval> | undefined;
      let lastStatus = "";

      const close = () => {
        if (closed) return;
        closed = true;
        if (timer) clearInterval(timer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      request.signal.addEventListener("abort", close);

      const tick = async () => {
        if (closed) return;
        const result = await reconcileInvoice(id);
        if (!result) {
          send("error", { error: "not found" });
          close();
          return;
        }
        if (result.invoice.status !== lastStatus) {
          lastStatus = result.invoice.status;
          send("status", {
            invoice: result.invoice,
            payment: result.payment ?? null,
          });
        }
        if (
          result.invoice.status === "confirmed" ||
          result.invoice.status === "expired" ||
          result.invoice.status === "cancelled" ||
          result.invoice.status === "failed"
        ) {
          close();
        }
      };

      timer = setInterval(() => {
        void tick();
      }, 1500);
      await tick();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
