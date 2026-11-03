import { PoolQueueCounselor } from "./PoolQueueCounselor"
import { getAvailableClientsAction } from "./actions"

export const dynamic = "force-dynamic"

export default async function CounselorKlienTersediaPage() {
  const res = await getAvailableClientsAction()
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Klien Tersedia</h1>
        <p className="text-sm text-muted-foreground">
          Klien yang memilih Konselor Bebas dan cocok dengan jadwal kosong Anda. Siapa cepat dia dapat; klaim ditutup H-4 jam sebelum sesi.
        </p>
      </div>
      <PoolQueueCounselor items={res.success ? res.data : []} error={res.success ? null : res.error} />
    </div>
  )
}
