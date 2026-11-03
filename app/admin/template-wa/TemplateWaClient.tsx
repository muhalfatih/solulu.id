"use client"

import * as React from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { formatDateTimeWib } from "@/lib/format/datetime"
import {
  WA_PLACEHOLDERS,
  WA_TEMPLATE_MAX_LENGTH,
  WA_TEMPLATE_META,
  formatPlaceholder,
  validateTemplateBody,
  type WaTemplateKey,
} from "@/lib/whatsapp/templates"
import { saveWhatsAppTemplateAction } from "./actions"

export interface TemplateItem {
  key: WaTemplateKey
  body: string
  updatedAt: string | null
}

function TemplateCard({ item }: { item: TemplateItem }) {
  const meta = WA_TEMPLATE_META[item.key]
  const [body, setBody] = React.useState(item.body)
  const [saved, setSaved] = React.useState(item.body)
  const [pending, startTransition] = React.useTransition()
  const check = validateTemplateBody(body)
  const dirty = body !== saved
  const textareaId = `tpl-${item.key}`

  function save() {
    startTransition(async () => {
      const result = await saveWhatsAppTemplateAction({ key: item.key, body })
      if (result.success) {
        setSaved(body)
        toast.success(`Template ${meta.name} disimpan`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{meta.name}</CardTitle>
        <CardDescription>
          {meta.description}
          {item.updatedAt ? ` Terakhir diubah ${formatDateTimeWib(item.updatedAt)}.` : " Belum diatur."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <label htmlFor={textareaId} className="sr-only">
          Isi template {meta.name}
        </label>
        <Textarea
          id={textareaId}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          maxLength={WA_TEMPLATE_MAX_LENGTH + 200}
          aria-invalid={!check.ok}
          aria-describedby={`${textareaId}-help`}
        />
        <p id={`${textareaId}-help`} className={check.ok ? "text-xs text-muted-foreground" : "text-xs text-destructive"}>
          {check.ok ? `${body.length}/${WA_TEMPLATE_MAX_LENGTH} karakter.` : check.error}
        </p>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={save} disabled={pending || !dirty || !check.ok}>
          {pending ? <Spinner /> : null}
          Simpan
        </Button>
      </CardFooter>
    </Card>
  )
}

export function TemplateWaClient({ items }: { items: TemplateItem[] }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-2 border-b border-border pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Template WA</h1>
        <p className="text-sm text-muted-foreground">
          Teks pesan WhatsApp yang dirender otomatis di Dispatch WhatsApp. Gunakan placeholder berikut:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {WA_PLACEHOLDERS.map((p) => (
            <Badge key={p} variant="outline" className="font-mono">
              {formatPlaceholder(p)}
            </Badge>
          ))}
        </div>
      </div>
      {items.map((item) => (
        <TemplateCard key={item.key} item={item} />
      ))}
    </div>
  )
}
