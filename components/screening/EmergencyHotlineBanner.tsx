import * as React from "react";
import { PhoneCall, ShieldAlert, HeartHandshake, ExternalLink } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

export interface EmergencyHotlineBannerProps {
  variant?: "supportive" | "crisis";
  compact?: boolean;
  className?: string;
  showHelpDescription?: boolean;
}

/**
 * Komponen Banner Darurat & Hotline Krisis Kesehatan Jiwa
 * 
 * Sesuai panduan DESIGN.md:
 * - Menggunakan palette non-intimidatif (Amber / Clinical Alert Rose terukur).
 * - Memberikan akses cepat ke nomor darurat nasional: Hotline Kemenkes 119 Ext. 8 / Layanan SEJIWA.
 * - Menyampaikan pesan empatik dan menenangkan tanpa alarmisme.
 */
export function EmergencyHotlineBanner({
  variant = "supportive",
  compact = false,
  className,
  showHelpDescription = true,
}: EmergencyHotlineBannerProps) {
  const isCrisis = variant === "crisis";

  if (compact) {
    return (
      <aside
        aria-label="Informasi Kontak Krisis Darurat"
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs transition-colors",
          isCrisis
            ? "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200"
            : "bg-amber-500/10 border-amber-500/20 text-amber-950 dark:text-amber-200",
          className
        )}
      >
        <div className="flex items-center gap-2">
          {isCrisis ? (
            <ShieldAlert
              data-icon="inline-start"
              className="size-4 shrink-0 text-rose-600 dark:text-rose-400"
            />
          ) : (
            <HeartHandshake
              data-icon="inline-start"
              className="size-4 shrink-0 text-amber-600 dark:text-amber-400"
            />
          )}
          <span>
            {isCrisis
              ? "Butuh bantuan krisis segera? Bantuan gratis dan rahasia tersedia 24 jam:"
              : "Sedang dalam kondisi krisis emosional darurat? Hubungi Layanan Sejiwa."}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            asChild
            variant={isCrisis ? "destructive" : "outline"}
            size="sm"
            className={cn(
              "h-7 text-xs font-semibold px-2.5 gap-1.5 shadow-none",
              !isCrisis &&
                "border-amber-500/30 bg-amber-500/10 text-amber-950 hover:bg-amber-500/20 dark:text-amber-100"
            )}
          >
            <a href="tel:119" aria-label="Telepon Hotline Kemenkes 119 Ext 8">
              <PhoneCall className="size-3.5" data-icon="inline-start" />
              <span>Telepon 119 Ext. 8</span>
            </a>
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <section
      aria-label="Layanan Bantuan Krisis dan Darurat Kesehatan Mental"
      className={cn(
        "w-full rounded-2xl border p-4 sm:p-5 relative overflow-hidden transition-all",
        isCrisis
          ? "bg-rose-500/[0.08] border-rose-500/40 text-foreground"
          : "bg-amber-500/[0.07] border-amber-500/25 text-foreground",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-xs",
              isCrisis
                ? "bg-rose-600 text-white dark:bg-rose-500"
                : "bg-amber-600 text-white dark:bg-amber-500"
            )}
          >
            {isCrisis ? (
              <ShieldAlert className="size-5" />
            ) : (
              <HeartHandshake className="size-5" />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                  isCrisis
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300"
                    : "bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300"
                )}
              >
                {isCrisis ? "Dukungan Keselamatan Diri" : "Kontak Bantuan Darurat"}
              </span>
              <span className="text-xs text-muted-foreground">• Layanan 24 Jam Bebas Pulsa</span>
            </div>

            <h3 className="text-base font-bold tracking-tight">
              {isCrisis
                ? "Kami Peduli dengan Keselamatan Anda. Anda Tidak Sendirian."
                : "Butuh Bantuan Krisis Emosional Segera?"}
            </h3>

            {showHelpDescription && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl text-pretty">
                {isCrisis
                  ? "Jika Anda memiliki pikiran untuk mengakhiri hidup atau merasa beban emosional terasa terlalu berat untuk ditanggung sendiri, mohon segera hubungi layanan pertolongan pertama krisis kejiwaan profesional berikut. Anda berharga dan pertolongan selalu tersedia."
                  : "Konseling Solulu dijadwalkan secara daring melalui sesi temu janji. Apabila Anda atau orang terdekat mengalami situasi krisis darurat medis/psikologis yang membutuhkan penanganan langsung detik ini, silakan hubungi saluran darurat resmi nasional."}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-col items-stretch gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          <Button
            asChild
            variant={isCrisis ? "destructive" : "default"}
            size="default"
            className={cn(
              "font-semibold gap-2 shadow-xs cursor-pointer w-full sm:w-auto justify-center",
              !isCrisis &&
                "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
            )}
          >
            <a href="tel:119" aria-label="Panggil Hotline Kemenkes 119 Ext 8">
              <PhoneCall className="size-4" data-icon="inline-start" />
              <span>Telepon 119 Ext. 8 (SEJIWA)</span>
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 w-full sm:w-auto justify-center border-border hover:bg-muted"
          >
            <a
              href="https://ayosehat.kemkes.go.id"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Buka portal Kemenkes Ayo Sehat"
            >
              <span>Info Layanan Kemenkes</span>
              <ExternalLink className="size-3" data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
