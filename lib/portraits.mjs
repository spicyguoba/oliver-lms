import fs from "node:fs";
const people = new Map(
  JSON.parse(
    fs.readFileSync(new URL("../content/people.json", import.meta.url), "utf8"),
  ).people.map((p) => [p.id, p]),
);
const fallback = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="360" viewBox="0 0 320 360"><rect width="320" height="360" rx="20" fill="#eee9da"/><circle cx="160" cy="121" r="49" fill="#becbbd"/><path d="M65 280q0-100 95-100t95 100" fill="#becbbd"/><text x="160" y="324" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#38514a">Picture unavailable</text></svg>`;
export async function portraitResponse(id, fetcher = fetch) {
  const image = people.get(id)?.image;
  if (!image)
    return new Response(fallback, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  try {
    const url = new URL(image.url);
    if (
      url.protocol !== "https:" ||
      !["upload.wikimedia.org", "thumb.wikimedia.org"].includes(url.hostname) ||
      !url.pathname.startsWith("/wikipedia/commons/")
    )
      throw Error("Image source not allowed");
    const upstream = await fetcher(url.toString(), {
      headers: {
        "User-Agent": "OliverStudyClub/1.0 (educational thumbnail cache)",
      },
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    const type = upstream.headers.get("content-type")?.split(";")[0];
    if (
      !upstream.ok ||
      !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(type) ||
      Number(upstream.headers.get("content-length")) > 5000000
    )
      throw Error("Picture not available");
    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength > 5000000) throw Error("Picture too large");
    return new Response(bytes, {
      headers: {
        "Content-Type": type,
        "Cache-Control":
          "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(fallback, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
}
