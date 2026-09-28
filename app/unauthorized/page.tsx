import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Akses Tidak Diizinkan
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Akun Anda tidak memiliki hak akses untuk membuka halaman ini. Pastikan
            Anda masuk dengan akun dan peran (*role*) yang sesuai.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Beranda
            </Link>
          </Button>

          <Button asChild className="w-full sm:w-auto">
            <Link href="/login">
              <LogIn className="h-4 w-4 mr-1.5" /> Masuk Akun Lain
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
