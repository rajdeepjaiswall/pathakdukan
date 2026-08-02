import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Pool } from "@neondatabase/serverless";

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

const pool = new Pool({ connectionString: process.env.CUSTOM_DB_URL });

const images = [
  {
    url: "https://images.pexels.com/photos/18488320/pexels-photo-18488320/free-photo-of-rose-barfi.jpeg?auto=compress&cs=tinysrgb&w=800",
    name: "kaju-katli-1.jpeg",
  },
  {
    url: "https://cdn.mygingergarlickitchen.com/images/800px/800px-recipes-Kaju-Katli-Kaju-Burfi-anupama-paliwal-my-ginger-garlic-kitchen-2.jpg",
    name: "kaju-katli-2.jpg",
  },
  {
    url: "https://www.tashasartisanfoods.com/blog/wp-content/uploads/2020/08/Kaju-Katli-7-980x1024.jpg",
    name: "kaju-katli-3.jpg",
  },
  {
    url: "https://www.aromaticessence.co/wp-content/uploads/2018/10/image9-min-3.jpeg",
    name: "kaju-katli-4.jpeg",
  },
];

async function downloadImage(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const mimeType = response.headers.get("content-type") || "image/jpeg";
  return { buffer, mimeType };
}

async function uploadToR2(buffer: Buffer, mimeType: string, name: string): Promise<string> {
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const ext = extMap[mimeType] || "jpg";
  const key = `products/images/${Date.now()}_${name.replace(/\.(jpg|jpeg|png|webp|gif)$/i, "")}.${ext}`;

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

async function migrate() {
  console.log("Starting Kaju Katli image migration...\n");
  const cdnUrls: string[] = [];

  for (const img of images) {
    try {
      console.log(`Downloading: ${img.url}`);
      const { buffer, mimeType } = await downloadImage(img.url);
      console.log(`  Size: ${(buffer.length / 1024).toFixed(1)} KB, MIME: ${mimeType}`);

      console.log(`Uploading to R2...`);
      const cdnUrl = await uploadToR2(buffer, mimeType, img.name);
      console.log(`  CDN URL: ${cdnUrl}\n`);
      cdnUrls.push(cdnUrl);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      // Keep original URL on failure
      cdnUrls.push(img.url);
    }
  }

  console.log("\nUpdating database...");
  const result = await pool.query(
    "UPDATE products SET images = $1 WHERE id = 93 RETURNING id, name",
    [JSON.stringify(cdnUrls)]
  );
  console.log(`Updated product: ${result.rows[0].id} - ${result.rows[0].name}`);
  console.log("\nMigration complete!");
  console.log("\nNew CDN URLs:");
  cdnUrls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));

  await pool.end();
}

migrate().catch(console.error);
