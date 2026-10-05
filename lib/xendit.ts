import crypto from "crypto"

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

/**
 * Creates an invoice with Xendit or generates a simulated invoice in mock/test mode.
 */
export async function createXenditInvoice(
  params: CreateInvoiceParams
): Promise<XenditInvoiceResponse> {
  const secretKey = process.env.XENDIT_SECRET_KEY

  const isMock =
    !secretKey ||
    secretKey.startsWith("xnd_development_...") ||
    secretKey === "mock" ||
    process.env.NODE_ENV === "test"

  if (isMock) {
    const mockId = `mock_inv_${crypto.randomBytes(8).toString("hex")}`
    const expiry = new Date(Date.now() + (params.invoiceDuration || 900) * 1000).toISOString()

    return {
      id: mockId,
      externalId: params.externalId,
      status: "PENDING",
      invoiceUrl: params.successRedirectUrl,
      expiryDate: expiry,
      amount: params.amount,
    }
  }

  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`

  const response = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
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
 */
export async function getXenditInvoice(invoiceId: string): Promise<any | null> {
  const secretKey = process.env.XENDIT_SECRET_KEY

  if (
    !secretKey ||
    secretKey.startsWith("xnd_development_...") ||
    secretKey === "mock" ||
    process.env.NODE_ENV === "test"
  ) {
    if (invoiceId.startsWith("mock_inv_")) {
      return {
        id: invoiceId,
        status: "PAID",
        payment_method: "MOCK_PAYMENT",
      }
    }
  }

  if (!secretKey) return null

  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`

  try {
    const response = await fetch(`https://api.xendit.co/v2/invoices/${encodeURIComponent(invoiceId)}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("[XENDIT_GET_INVOICE_ERROR]", error)
    return null
  }
}
