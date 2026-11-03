"use client"

import * as React from "react"
import { CheckCircle2, AlertCircle, Loader2, Landmark } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { updateBankAccountAction } from "@/app/counselor/honor/actions"
import type { BankAccount } from "@/lib/validations/bank-account"

export function BankAccountCard({ initial }: { initial: BankAccount | null }) {
  const [bankName, setBankName] = React.useState(initial?.bankName ?? "")
  const [accountNumber, setAccountNumber] = React.useState(initial?.accountNumber ?? "")
  const [accountHolder, setAccountHolder] = React.useState(initial?.accountHolder ?? "")
  const [pending, startTransition] = React.useTransition()
  const [errors, setErrors] = React.useState<Record<string, string[]>>({})
  const [message, setMessage] = React.useState<{ kind: "ok" | "error"; text: string } | null>(null)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const res = await updateBankAccountAction({ bankName, accountNumber, accountHolder })
      if (res.success) {
        setErrors({})
        setMessage({ kind: "ok", text: "Rekening bank tersimpan." })
      } else {
        setErrors(res.fieldErrors ?? {})
        setMessage({ kind: "error", text: res.error ?? "Gagal menyimpan rekening bank." })
      }
    })
  }

  return (
    <Card className="max-w-3xl mx-auto w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="size-4" aria-hidden />
          Rekening Bank untuk Honor
        </CardTitle>
        <CardDescription>
          Dipakai Admin untuk transfer massal Honor Konselor. Pastikan nama pemilik sesuai buku tabungan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.bankName}>
              <FieldLabel htmlFor="bank-name">Nama bank</FieldLabel>
              <Input
                id="bank-name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="mis. BCA, Mandiri, BRI"
                aria-invalid={!!errors.bankName}
              />
              {errors.bankName && <FieldError>{errors.bankName[0]}</FieldError>}
            </Field>
            <Field data-invalid={!!errors.accountNumber}>
              <FieldLabel htmlFor="bank-account-number">Nomor rekening</FieldLabel>
              <Input
                id="bank-account-number"
                inputMode="numeric"
                autoComplete="off"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                aria-invalid={!!errors.accountNumber}
              />
              {errors.accountNumber && <FieldError>{errors.accountNumber[0]}</FieldError>}
            </Field>
            <Field data-invalid={!!errors.accountHolder}>
              <FieldLabel htmlFor="bank-account-holder">Atas nama</FieldLabel>
              <Input
                id="bank-account-holder"
                autoComplete="off"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                aria-invalid={!!errors.accountHolder}
              />
              {errors.accountHolder && <FieldError>{errors.accountHolder[0]}</FieldError>}
            </Field>
            {message && (
              <Alert variant={message.kind === "error" ? "destructive" : "default"}>
                {message.kind === "error" ? <AlertCircle /> : <CheckCircle2 />}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
            <div>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="animate-spin" aria-hidden />}
                Simpan rekening
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
