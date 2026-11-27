// Publishes a built Android APK to the project's Vercel Blob store at a stable
// path, so the public download link never changes between releases.
//
//   node scripts/publish-apk.mjs <path-or-https-url-to-apk>
//
// Needs BLOB_READ_WRITE_TOKEN (present automatically in Vercel builds once the
// Blob store is connected to the project). Never fails the calling build.
import { readFile } from "node:fs/promises";
import { put } from "@vercel/blob";

const src = process.argv[2];
if (!src) {
  console.log("[publish-apk] no APK source given — skipping");
  process.exit(0);
}
try {
  const data = src.startsWith("https://")
    ? Buffer.from(await (await fetch(src)).arrayBuffer())
    : await readFile(src);
  if (data.length < 1_000_000 || data.subarray(0, 2).toString() !== "PK") {
    throw new Error(`not an APK (${data.length} bytes)`);
  }
  const blob = await put("WePay.apk", data, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/vnd.android.package-archive",
    cacheControlMaxAge: 60,
  });
  console.log(`[publish-apk] published ${data.length} bytes → ${blob.url}`);
} catch (e) {
  console.error("[publish-apk] skipped:", e instanceof Error ? e.message : e);
}
