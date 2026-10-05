import { NextRequest, NextResponse } from "next/server"
import { generateR2Key, uploadBufferToR2 } from "@/lib/r2"

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]

const MAX_FILE_SIZE_DOCS = 15 * 1024 * 1024 // 15MB
const MAX_FILE_SIZE_IMG = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const category = (formData.get("category") as string) || "avatars"

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Tidak ada berkas yang diunggah" },
        { status: 400 }
      )
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Format berkas tidak didukung. Format yang diizinkan: PDF, JPG, PNG, WebP.",
        },
        { status: 400 }
      )
    }

    // Validate Size
    const isImageCategory = category === "avatar" || category === "avatars" || category === "gallery"
    const maxSize = isImageCategory ? MAX_FILE_SIZE_IMG : MAX_FILE_SIZE_DOCS
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `Ukuran berkas melebihi batas maksimal (${isImageCategory ? "5MB" : "15MB"}).`,
        },
        { status: 400 }
      )
    }

    // Map prefix
    let prefix = "uploads"
    if (category === "avatar" || category === "avatars") {
      prefix = "avatars"
    } else if (category === "gallery") {
      prefix = "gallery"
    } else if (["cv", "ktp", "diploma", "str"].includes(category)) {
      prefix = `counselor-applications/${category}`
    } else if (category === "report") {
      prefix = "reports"
    }

    const key = generateR2Key(prefix, file.name)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await uploadBufferToR2({
      key,
      buffer,
      contentType: file.type,
    })

    return NextResponse.json({
      success: true,
      data: {
        r2Key: result.key,
        publicUrl: result.publicUrl,
        uploadUrl: result.publicUrl,
      },
    })
  } catch (err: any) {
    console.error("[API_UPLOAD_ERROR]", err)
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Gagal mengunggah berkas ke penyimpanan Cloudflare R2",
      },
      { status: 500 }
    )
  }
}
