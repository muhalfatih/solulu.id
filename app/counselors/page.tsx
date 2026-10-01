import { getCounselorsCatalogAction, type CatalogCounselorView } from "./actions"
import { getFallbackCounselors } from "./data"
import { getPlatformSettings } from "@/lib/settings/platform"
import CounselorsCatalogClient from "./CounselorsCatalogClient"

export const metadata = {
  title: "Pilih Konselor | Solulu",
  description:
    "Pilihan psikolog klinis berizin resmi dan teman cerita terlatih untuk sesi ngobrol 90 menit via Zoom tanpa ribet bikin akun.",
}

export default async function CounselorsCatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = searchParams ? await searchParams : {}
  const screeningId =
    typeof params.screeningId === "string" ? params.screeningId : undefined
  const rawType = typeof params.type === "string" ? params.type : undefined
  const recommendedType =
    rawType === "clinical" ? "psychologist" : rawType === "peer" ? "peer" : undefined

  const result = await getCounselorsCatalogAction({
    type: recommendedType,
  })

  let initialCounselors: CatalogCounselorView[] = []

  if (result.success && result.data && result.data.length > 0) {
    initialCounselors = result.data
  } else {
    initialCounselors = getFallbackCounselors(recommendedType)
  }

  const settings = await getPlatformSettings()

  return (
    <CounselorsCatalogClient
      initialCounselors={initialCounselors}
      initialScreeningId={screeningId}
      initialRecommendedType={recommendedType}
      isScreeningRequired={settings.isScreeningRequired}
    />
  )
}
