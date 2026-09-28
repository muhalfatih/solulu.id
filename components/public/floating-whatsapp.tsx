import { MessageCircle } from "lucide-react"

export function FloatingWhatsApp() {
  return (
    <aside aria-label="Bantuan WhatsApp" className="fixed bottom-6 right-6 z-50">
      <a
        href="https://wa.me/6285144909949?text=Halo%20Solulu!%20Saya%20ingin%20tanya%20tentang%20sesi%20konseling."
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-medium text-xs shadow-lg shadow-[#25D366]/30 transition-all hover:scale-105 active:scale-95"
        id="btn-floating-whatsapp"
      >
        <MessageCircle className="size-5 fill-white text-[#25D366]" />
        <span className="font-semibold hidden sm:inline">Chat Sekarang</span>
      </a>
    </aside>
  )
}
