/**
 * File-storage abstraction.
 *
 * V1 decision: PDFs (and later avatars/covers) are referenced by external
 * URL only — MongoDB never holds binary. A direct-upload vendor
 * (UploadThing vs raw S3 — still open) will implement `createUpload`
 * in Phase 11; until then callers validate URLs with `assertFileUrl`.
 */
export type AllowedKind = "pdf" | "image";

const ALLOW: Record<AllowedKind, { mime: RegExp; maxBytes: number }> = {
  pdf: { mime: /^application\/pdf$/, maxBytes: 25 * 1024 * 1024 },
  image: { mime: /^image\/(png|jpeg|webp)$/, maxBytes: 5 * 1024 * 1024 },
};

export function assertFileUrl(url: string, kind: AllowedKind): void {
  if (!/^https?:\/\/.+\..+/.test(url)) {
    throw new Error(`Attach a valid http(s) ${kind.toUpperCase()} URL.`);
  }
}

export function describeLimit(kind: AllowedKind): string {
  const { maxBytes } = ALLOW[kind];
  return `${kind.toUpperCase()} up to ${Math.round(maxBytes / 1024 / 1024)} MB`;
}

/** Phase 11 seam: throws until a vendor is configured. */
export async function createUpload(): Promise<never> {
  throw new Error(
    "Direct uploads are not configured yet (vendor decision open — Phase 11). Paste a file URL instead.",
  );
}
