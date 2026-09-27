import { describe, it, expect, vi } from "vitest"
import {
  getR2Config,
  generateR2Key,
  generatePresignedPutUrl,
  generatePresignedGetUrl,
  getPublicR2Url,
} from "../lib/r2"

describe("R2 Cloudflare S3 Client (lib/r2.ts)", () => {
  it("resolves default configuration and endpoints", () => {
    const config = getR2Config()
    expect(config.publicBucketName).toBe("solulu-public")
    expect(config.privateBucketName).toBe("solulu-private")
    expect(config.publicDomain).toBe("https://cdn.solulu.id")
    expect(config.endpoint).toBeDefined()
  })

  it("generates sanitized, collision-resistant keys", () => {
    const key = generateR2Key("applications/cv", "My Resume (Final).pdf")
    expect(key).toMatch(/^applications\/cv\/[a-z0-9]{12}-my_resume_final_\.pdf$/)
  })

  it("generates presigned PUT URL targeting solulu-private bucket", async () => {
    const mockSignedUrl = "https://r2.cloudflarestorage.com/solulu-private/test.pdf?X-Amz-Signature=abc"
    const mockSigner = vi.fn().mockResolvedValue(mockSignedUrl)

    const result = await generatePresignedPutUrl({
      key: "applications/cv/123-cv.pdf",
      contentType: "application/pdf",
      expiresIn: 1800,
      signer: mockSigner,
    })

    expect(result.uploadUrl).toBe(mockSignedUrl)
    expect(result.key).toBe("applications/cv/123-cv.pdf")
    expect(result.bucket).toBe("solulu-private")
    expect(mockSigner).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: "solulu-private",
          Key: "applications/cv/123-cv.pdf",
          ContentType: "application/pdf",
        }),
      }),
      { expiresIn: 1800 }
    )
  })

  it("generates presigned GET URL with 15-minute (900s) default expiry for private documents", async () => {
    const mockSignedUrl = "https://r2.cloudflarestorage.com/solulu-private/test.pdf?X-Amz-Signature=xyz"
    const mockSigner = vi.fn().mockResolvedValue(mockSignedUrl)

    const url = await generatePresignedGetUrl({
      key: "applications/ktp/456-ktp.jpg",
      signer: mockSigner,
    })

    expect(url).toBe(mockSignedUrl)
    expect(mockSigner).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: "solulu-private",
          Key: "applications/ktp/456-ktp.jpg",
        }),
      }),
      { expiresIn: 900 } // 15 minutes as per spec
    )
  })

  it("generates public CDN URLs for public assets", () => {
    const url = getPublicR2Url("avatars/counselor-1.jpg")
    expect(url).toBe("https://cdn.solulu.id/avatars/counselor-1.jpg")

    const customUrl = getPublicR2Url("avatars/counselor-2.jpg", "https://media.solulu.id")
    expect(customUrl).toBe("https://media.solulu.id/avatars/counselor-2.jpg")
  })
})
