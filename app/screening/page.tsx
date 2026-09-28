import { Metadata } from "next";
import { ScreeningClient } from "./ScreeningClient";
import { getScreeningResultAction } from "./actions";

export const metadata: Metadata = {
  title: "Skrining Mandiri Kesejahteraan Emosional (SRQ-20) | Solulu",
  description:
    "Kuesioner klinis informatif 20 butir standar WHO & Kemenkes RI untuk memberikan konteks distres emosional secara objektif dan privat kepada Mitra Konselor Solulu.",
};

export default async function ScreeningPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const counselorId =
    typeof params.counselorId === "string" ? params.counselorId : undefined;
  const scheduleId =
    typeof params.scheduleId === "string" ? params.scheduleId : undefined;
  const screeningId =
    typeof params.screeningId === "string" ? params.screeningId : undefined;

  let initialScreeningData = null;
  if (screeningId) {
    const res = await getScreeningResultAction(screeningId);
    if (res.success && res.screening) {
      initialScreeningData = res.screening;
    }
  }

  return (
    <ScreeningClient
      initialCounselorId={counselorId}
      initialScheduleId={scheduleId}
      initialScreeningData={initialScreeningData}
    />
  );
}
