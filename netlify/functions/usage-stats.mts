import type { Config, Context } from "@netlify/functions";
import { getDeployStore, getStore } from "@netlify/blobs";

function statsStore() {
  return Netlify.context?.deploy?.context === "production"
    ? getStore("square-image-studio-usage")
    : getDeployStore("square-image-studio-usage");
}

async function counts(store: ReturnType<typeof getStore>) {
  const [images, exports] = await Promise.all([
    store.list({ prefix: "image/" }),
    store.list({ prefix: "export/" }),
  ]);
  return { images: images.blobs.length, exports: exports.blobs.length };
}

export default async (req: Request, _context: Context) => {
  const store = statsStore();

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const event = body?.event;
    if (event !== "image" && event !== "export") {
      return Response.json({ error: "Invalid event" }, { status: 400 });
    }

    const key = `${event}/${Date.now()}-${crypto.randomUUID()}`;
    await store.set(key, "1");
    return Response.json(await counts(store), { headers: { "Cache-Control": "no-store" } });
  }

  if (req.method === "GET") {
    return Response.json(await counts(store), { headers: { "Cache-Control": "no-store" } });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/usage-stats",
};
