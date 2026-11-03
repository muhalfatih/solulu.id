import { getXenditConfig, type IntegrationEnv } from "@/lib/config/integrations"

export interface CreateInvoiceParams {
  externalId: string
  amount: number
  payerEmail: string
  description: string
  invoiceDuration?: number // In seconds (default: 900 / 15 minutes)
  successRedirectUrl: string
  failureRedirectUrl: string
}

export interface XenditInvoiceResponse {
  id: string
  externalId: string
  status: string
  invoiceUrl: string
  expiryDate: string
  amount: number
}

export interface XenditClientOptions {
  env?: IntegrationEnv
  fetchFn?: typeof fetch
}

function basicAuthHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`
}

/**
 * Creates a real invoice with Xendit. Throws an IntegrationConfigError naming
 * XENDIT_SECRET_KEY when the key is missing; there is no simulated invoice.
 */
export async function createXenditInvoice(
  params: CreateInvoiceParams,
  options: XenditClientOptions = {}
): Promise<XenditInvoiceResponse> {
  const { secretKey } = getXenditConfig(options.env)
  const fetchFn = options.fetchFn ?? fetch

  const response = await fetchFn("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(secretKey),
    },
    body: JSON.stringify({
      external_id: params.externalId,
      amount: params.amount,
      payer_email: params.payerEmail,
      description: params.description,
      invoice_duration: params.invoiceDuration || 900,
      success_redirect_url: params.successRedirectUrl,
      failure_redirect_url: params.failureRedirectUrl,
      currency: "IDR",
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Gagal membuat invoice Xendit (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  return {
    id: data.id,
    externalId: data.external_id,
    status: data.status,
    invoiceUrl: data.invoice_url,
    expiryDate: data.expiry_date,
    amount: data.amount,
  }
}

/**
 * Retrieves an invoice from Xendit to verify its current payment status.
 * Returns null when Xendit reports no such invoice or cannot be reached.
 */
export async function getXenditInvoice(
  invoiceId: string,
  options: XenditClientOptions = {}
): Promise<any | null> {
  const { secretKey } = getXenditConfig(options.env)
  if (!secretKey) return null

  const fetchFn = options.fetchFn ?? fetch

  try {
    const response = await fetchFn(
      `https://api.xendit.co/v2/invoices/${encodeURIComponent(invoiceId)}`,
      {
        method: "GET",
        headers: { Authorization: basicAuthHeader(secretKey) },
      }
    )

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("[XENDIT_GET_INVOICE_ERROR]", error)
    return null
  }
}
