export const TRUSTFLOW_API_BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:soDKl_ie'
export const TRUSTFLOW_APP_BASE_URL = 'http://localhost:5173'

export type DocumentType = 'invoice' | 'assignment' | 'bank_letter'

export interface Vendor {
  id: number
  legal_name: string
  country: string
  registration_number?: string
  website?: string
  current_payee_name?: string
  current_bank_account?: string
  status?: string
}

export interface PaymentChangeForm {
  supplier: string
  invoiceNumber: string
  contractId: string
  amount: string
  currency: string
  currentPayee: string
  requestedPayee: string
  currentBankAccount: string
  requestedBankAccount: string
  requestDomain: string
  changeReason: string
  documents: SupportingDocument[]
}

export interface SupportingDocument {
  type: DocumentType
  label: string
  filename: string
  fileUrl: string
}

export interface CreatedRequest {
  id: number
  request_key: string
  vendor_id: number
  invoice_number: string
  contract_id: string
  amount: number
  currency: string
  requested_payee_name: string
  requested_bank_account: string
  change_reason: string
  status: string
  policy_decision?: string
  final_decision?: string
  created_at: number
}

export interface CreatedDocument {
  id: number
  request_id: number
  document_type: DocumentType
  filename: string
  file_url: string
  processing_status: string
}

export interface SubmissionResult {
  request: CreatedRequest
  documents: CreatedDocument[]
}

const vendorDefaults = {
  country: 'US',
  registration_number: 'US-NY-ABC-204',
  website: '',
  current_payee_name: 'ABC Manufacturing Inc.',
  current_bank_account: 'US-ABC-1008'
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${TRUSTFLOW_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers ?? {})
    }
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return response.json() as Promise<T>
}

export async function findOrCreateVendor(form: PaymentChangeForm): Promise<Vendor> {
  const vendors = await request<Vendor[]>('/vendors')
  const existing = vendors.find(vendor => vendor.legal_name.toLowerCase() === form.supplier.trim().toLowerCase())
  if (existing) return existing

  return request<Vendor>('/vendors', {
    method: 'POST',
    body: JSON.stringify({
      legal_name: form.supplier.trim(),
      country: vendorDefaults.country,
      registration_number: vendorDefaults.registration_number,
      website: vendorDefaults.website,
      current_payee_name: form.currentPayee.trim() || form.supplier.trim(),
      current_bank_account: form.currentBankAccount.trim()
    })
  })
}

export async function submitPaymentChange(form: PaymentChangeForm): Promise<SubmissionResult> {
  const vendor = await findOrCreateVendor(form)
  const requestKey = createRequestKey()
  const createdRequest = await request<CreatedRequest>('/requests', {
    method: 'POST',
    body: JSON.stringify({
      request_key: requestKey,
      vendor_id: vendor.id,
      invoice_number: form.invoiceNumber.trim(),
      contract_id: form.contractId.trim(),
      amount: Number(form.amount),
      currency: form.currency.trim().toUpperCase(),
      requested_payee_name: form.requestedPayee.trim(),
      requested_bank_account: form.requestedBankAccount.trim(),
      request_domain: form.requestDomain.trim(),
      change_reason: form.changeReason.trim()
    })
  })

  const documents: CreatedDocument[] = []
  const docErrors: string[] = []
  for (const doc of form.documents) {
    try {
      documents.push(await request<CreatedDocument>(`/requests/${createdRequest.id}/documents`, {
        method: 'POST',
        body: JSON.stringify({
          document_type: doc.type,
          filename: doc.filename,
          file_url: doc.fileUrl
        })
      }))
    } catch (e) {
      docErrors.push(`${doc.label} (${doc.filename}): ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  if (docErrors.length > 0 && documents.length === 0) {
    throw new Error(
      `Request created (ID: ${createdRequest.id}) but all document attachments failed:\n${docErrors.join('\n')}`
    )
  }

  if (docErrors.length > 0) {
    console.warn('Some documents failed to attach:', docErrors)
  }

  return { request: createdRequest, documents }
}

function createRequestKey() {
  const now = new Date()
  const stamp = now.toISOString().slice(0, 10).replaceAll('-', '')
  const random = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `REQ-ACME-${stamp}-${random}`
}

export async function getRequests(): Promise<CreatedRequest[]> {
  return request<CreatedRequest[]>('/requests')
}

export async function getRequest(id: number): Promise<CreatedRequest> {
  return request<CreatedRequest>(`/requests/${id}`)
}

export async function getDocuments(requestId: number): Promise<CreatedDocument[]> {
  return request<CreatedDocument[]>(`/requests/${requestId}/documents`)
}
export async function getVendors(): Promise<Vendor[]> {
  return request<Vendor[]>('/vendors')
}
export function getEffectiveDecision(request: CreatedRequest): string {
  const decision = request.final_decision || request.policy_decision || null
  if (!decision) return 'Pending Verification'
  if (decision === 'ALLOW') return 'Allowed'
  if (decision === 'REVIEW_REQUIRED') return 'Review Required'
  if (decision === 'BLOCK') return 'Blocked'
  return decision
}
