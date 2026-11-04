import { randomFillSync } from "node:crypto"

// 32 karakter (tanpa 0, 1, I, O) agar kode mudah dibaca di nama ruang Zoom dan WhatsApp.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
const CODE_LENGTH = 6

function secureRandomBytes(length: number): Uint8Array {
  return randomFillSync(new Uint8Array(length))
}

/**
 * Membuat Kode Booking unik, misalnya "SL-7K2M9Q". Dipakai sebagai default sisi aplikasi
 * pada insert `bookings` sehingga tidak ada nilai statis yang dikarang di database.
 */
export function generateBookingCode(
  randomBytes: (length: number) => Uint8Array = secureRandomBytes
): string {
  const bytes = randomBytes(CODE_LENGTH)
  let suffix = ""
  for (let i = 0; i < CODE_LENGTH; i++) {
    suffix += ALPHABET[bytes[i] & 31]
  }
  return `SL-${suffix}`
}
