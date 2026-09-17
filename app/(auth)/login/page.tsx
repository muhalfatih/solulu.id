"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, LogIn, AlertCircle, ArrowLeft } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Email atau kata sandi salah. Silakan periksa kembali."
            : authError.message
        );
        setLoading(false);
        return;
      }

      if (data.user) {
        const role =
          data.user.app_metadata?.role || data.user.user_metadata?.role;

        if (redirectParam && redirectParam.startsWith("/")) {
          router.push(redirectParam);
        } else if (role === "admin") {
          router.push("/admin/dashboard");
        } else if (role === "counselor") {
          router.push("/counselor/dashboard");
        } else {
          router.push("/");
        }
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba sesaat lagi.");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-muted bg-card/95 backdrop-blur-xs">
      <CardHeader className="space-y-1.5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Masuk ke Portal Solulu
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Khusus Mitra Konselor dan Administrator Platform
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Alamat Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@solulu.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Kata Sandi</Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            className="w-full font-medium"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">Memproses...</span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4" /> Masuk
              </span>
            )}
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Pasien tidak perlu akun untuk sesi konseling.{" "}
            <Link href="/" className="underline hover:text-foreground">
              Kembali ke Beranda
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-radial from-background via-background to-muted/30">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Beranda Solulu
        </Link>
      </div>

      <React.Suspense
        fallback={
          <div className="w-full max-w-md h-72 rounded-xl bg-card/50 animate-pulse" />
        }
      >
        <LoginForm />
      </React.Suspense>
    </main>
  );
}
