import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Build the Cloudflare R2 endpoint from the Account ID
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

const r2Client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || "";
const PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || "").replace(/\/$/, "");

/**
 * Upload a base64 data URL to Cloudflare R2.
 * Returns the public CDN URL of the uploaded file.
 *
 * @param base64DataUrl  Full data URL  e.g. "data:image/png;base64,iVBOR..."
 * @param folder         R2 folder key  e.g. "products/images"
 * @param mimeHint       Optional fallback mime type if not in data URL
 */
export async function uploadBase64ToR2(
  base64DataUrl: string,
  folder: string,
  mimeHint?: string
): Promise<string> {
  // Parse the data URL  →  data:<mime>;base64,<data>
  const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 data URL format");
  }

  const mimeType = matches[1] || mimeHint || "application/octet-stream";
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  // Build file extension from mime type
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
  };
  const ext = extMap[mimeType] || mimeType.split("/")[1] || "bin";
  const key = `${folder}/${Date.now()}.${ext}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return `${PUBLIC_URL}/${key}`;
}

/**
 * Delete a file from Cloudflare R2 by its CDN URL.
 * Returns true if deletion succeeded, false if it was a no-op (not our CDN URL).
 * Logs errors but never throws — safe to call without try/catch.
 */
export async function deleteFromR2(cdnUrl: string): Promise<boolean> {
  if (!cdnUrl || !cdnUrl.startsWith(PUBLIC_URL)) {
    // Not a URL in our R2 bucket — nothing to do
    return false;
  }

  // Extract key from URL: https://pub-...r2.dev/products/images/123.jpg
  const key = cdnUrl.replace(`${PUBLIC_URL}/`, "");
  if (!key) return false;

  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    console.log(`[R2] Deleted: ${key}`);
    return true;
  } catch (err) {
    console.error(`[R2] Failed to delete ${key}:`, err);
    return false;
  }
}

/**
 * Returns true if R2 credentials are configured.
 */
export function isR2Configured(): boolean {
  return !!(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
    process.env.CLOUDFLARE_R2_BUCKET_NAME &&
    process.env.CLOUDFLARE_R2_PUBLIC_URL
  );
}
