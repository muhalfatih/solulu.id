import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from "crypto"
import { getR2Credentials, type IntegrationEnv } from "@/lib/config/integrations"

export interface R2Config {
  accountId?: string
  accessKeyId?: string
  secretAccessKey?: string
  publicBucketName?: string
  privateBucketName?: string
  publicDomain?: string
  endpoint?: string
}

let cachedS3Client: S3Client | null = null

export function getR2Config(env: IntegrationEnv = process.env): R2Config {
  return {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    publicBucketName: env.R2_PUBLIC_BUCKET_NAME || "solulu-public",
    privateBucketName: env.R2_PRIVATE_BUCKET_NAME || "solulu-private",
    publicDomain: env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || "https://cdn.solulu.id",
    endpoint:
      env.R2_ENDPOINT ||
      (env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined),
  }
}

/**
 * Returns an S3Client configured for Cloudflare R2.
 * Throws an IntegrationConfigError naming the missing variable when R2
 * credentials are absent; there are no placeholder credentials.
 */
export function getR2Client(
  customConfig?: Partial<R2Config>,
  env: IntegrationEnv = process.env
): S3Client {
  if (!customConfig && cachedS3Client) {
    return cachedS3Client
  }

  const hasCustomCredentials = Boolean(customConfig?.accessKeyId && customConfig?.secretAccessKey)
  const resolved = hasCustomCredentials
    ? {
        accessKeyId: customConfig!.accessKeyId as string,
        secretAccessKey: customConfig!.secretAccessKey as string,
        endpoint: customConfig!.endpoint ?? getR2Config(env).endpoint,
      }
    : getR2Credentials(env)

  const client = new S3Client({
    region: "auto",
    endpoint: customConfig?.endpoint ?? resolved.endpoint,
    credentials: {
      accessKeyId: resolved.accessKeyId,
      secretAccessKey: resolved.secretAccessKey,
    },
  })

  if (!customConfig) {
    cachedS3Client = client
  }

  return client
}

/**
 * Generates a collision-resistant, sanitized R2 object key.
 */
export function generateR2Key(prefix: string, fileName: string): string {
  const sanitized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
  const uuid = crypto.randomUUID().replace(/-/g, "").slice(0, 12)
  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, "")
  return `${cleanPrefix}/${uuid}-${sanitized}`
}

export type SignerFn = (client: any, command: any, options?: any) => Promise<string>

/**
 * Generates a presigned PUT URL for client-side direct upload to R2 (bypassing Vercel server).
 * Default expires in 3600 seconds (1 hour).
 */
export async function generatePresignedPutUrl({
  bucket,
  key,
  contentType,
  expiresIn = 3600,
  client,
  signer = getSignedUrl,
}: {
  bucket?: string
  key: string
  contentType: string
  expiresIn?: number
  client?: S3Client
  signer?: SignerFn
}): Promise<{ uploadUrl: string; key: string; bucket: string }> {
  const targetBucket = bucket || getR2Config().privateBucketName || "solulu-private"
  const s3 = client || getR2Client()

  const command = new PutObjectCommand({
    Bucket: targetBucket,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await signer(s3, command, { expiresIn })

  return {
    uploadUrl,
    key,
    bucket: targetBucket,
  }
}

/**
 * Generates a presigned GET URL for viewing private documents.
 * Adheres to Solulu PRD spec: Default expires in 900 seconds (15 minutes).
 */
export async function generatePresignedGetUrl({
  bucket,
  key,
  expiresIn = 900,
  client,
  signer = getSignedUrl,
}: {
  bucket?: string
  key: string
  expiresIn?: number
  client?: S3Client
  signer?: SignerFn
}): Promise<string> {
  const targetBucket = bucket || getR2Config().privateBucketName || "solulu-private"
  const s3 = client || getR2Client()

  const command = new GetObjectCommand({
    Bucket: targetBucket,
    Key: key,
  })

  return signer(s3, command, { expiresIn })
}

/**
 * Formats a public CDN URL for objects stored in the public bucket (e.g. counselor avatars).
 */
export function getPublicR2Url(key: string, customDomain?: string): string {
  const domain = customDomain || getR2Config().publicDomain || "https://cdn.solulu.id"
  const cleanDomain = domain.replace(/\/+$/, "")
  const cleanKey = key.replace(/^\/+/, "")
  return `${cleanDomain}/${cleanKey}`
}

/**
 * Uploads a buffer directly to R2 from the server, eliminating any client-side CORS issues.
 */
export async function uploadBufferToR2({
  bucket,
  key,
  buffer,
  contentType,
}: {
  bucket?: string
  key: string
  buffer: Buffer | Uint8Array
  contentType: string
}): Promise<{ key: string; publicUrl: string; bucket: string }> {
  const targetBucket =
    bucket ||
    (key.startsWith("avatars/") || key.startsWith("gallery/")
      ? getR2Config().publicBucketName || "solulu-public"
      : getR2Config().privateBucketName || "solulu-private")

  const s3 = getR2Client()
  await s3.send(
    new PutObjectCommand({
      Bucket: targetBucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )

  return {
    key,
    publicUrl: getPublicR2Url(key),
    bucket: targetBucket,
  }
}
