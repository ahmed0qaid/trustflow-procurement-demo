import type { PaymentChangeForm, SupportingDocument } from './trustflowApi'

const rawBase = 'https://raw.githubusercontent.com/ahmed0qaid/trustflow-sentinel/main/demo-data/generated'

const docs = {
  case1Invoice: documentRef('invoice', 'Invoice', 'case1_invoice.pdf'),
  case2Invoice: documentRef('invoice', 'Invoice', 'case2_invoice.pdf'),
  case2Assignment: documentRef('assignment', 'Assignment', 'case2_assignment.pdf'),
  case2BankLetter: documentRef('bank_letter', 'Bank Letter', 'case2_bank_letter.pdf'),
  case3Invoice: documentRef('invoice', 'Invoice', 'case3_invoice.pdf'),
  case3BankLetter: documentRef('bank_letter', 'Bank Letter', 'case3_bank_letter.pdf')
} as const

export const presets = [
  {
    id: 'standard-payment',
    name: 'Standard Payment',
    note: 'No payment destination change.',
    form: makeForm({
      invoiceNumber: 'INV-1008',
      contractId: 'CF-2026-01',
      amount: '24500',
      requestedPayee: 'ABC Manufacturing Inc.',
      requestedBankAccount: 'US-ABC-1008',
      requestDomain: 'abcmfg.example',
      changeReason: 'Routine invoice; no payment destination change.',
      documents: [docs.case1Invoice]
    })
  },
  {
    id: 'legitimate-factoring',
    name: 'Legitimate Factoring',
    note: 'Receivables assigned to a financing partner.',
    form: makeForm({
      invoiceNumber: 'INV-7812',
      contractId: 'CF-2026-04',
      amount: '175000',
      requestedPayee: 'NorthStar Finance LLC',
      requestedBankAccount: 'US-NSF-7821',
      requestDomain: 'northstarfinance.com',
      changeReason: 'Receivables factoring arrangement',
      documents: [docs.case2Invoice, docs.case2Assignment, docs.case2BankLetter]
    })
  },
  {
    id: 'unauthorized-change',
    name: 'Unauthorized Destination Change',
    note: 'Urgent destination change with unsupported new payee.',
    form: makeForm({
      invoiceNumber: 'INV-9001',
      contractId: 'CF-2026-04',
      amount: '420000',
      requestedPayee: 'GlobalPay Holdings',
      requestedBankAccount: 'US-GPH-9911',
      requestDomain: 'globalpay-payments.invalid',
      changeReason: 'Urgent payment destination update',
      documents: [docs.case3Invoice, docs.case3BankLetter]
    })
  }
]

export const emptyForm = makeForm({
  invoiceNumber: '',
  contractId: '',
  amount: '',
  requestedPayee: '',
  requestedBankAccount: '',
  requestDomain: '',
  changeReason: '',
  documents: []
})

function makeForm(overrides: Partial<PaymentChangeForm>): PaymentChangeForm {
  return {
    supplier: 'ABC Manufacturing Inc.',
    invoiceNumber: '',
    contractId: '',
    amount: '',
    currency: 'USD',
    currentPayee: 'ABC Manufacturing Inc.',
    requestedPayee: '',
    currentBankAccount: 'US-ABC-1008',
    requestedBankAccount: '',
    requestDomain: '',
    changeReason: '',
    documents: [],
    ...overrides
  }
}

function documentRef(type: SupportingDocument['type'], label: string, filename: string): SupportingDocument {
  return {
    type,
    label,
    filename,
    fileUrl: `${rawBase}/${filename}`
  }
}
