import { useState, useMemo } from 'react'
import { AlertCircle, ArrowUpRight, CircleDashed, FileText, Send } from 'lucide-react'
import { presets, emptyForm } from '../presets'
import { submitPaymentChange, type PaymentChangeForm } from '../trustflowApi'

const requiredFields: Array<keyof PaymentChangeForm> = [
  'supplier', 'invoiceNumber', 'contractId', 'amount', 'currency',
  'currentPayee', 'requestedPayee', 'currentBankAccount', 'requestedBankAccount'
]

function validateForm(form: PaymentChangeForm) {
  const missing = requiredFields.filter(field => String(form[field]).trim() === '')
  if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) missing.push('amount')
  if (form.documents.length === 0) missing.push('documents')
  return [...new Set(missing)]
}

export function NewRequest({ onNavigate }: { onNavigate: (view: string, id?: number) => void }) {
  const [form, setForm] = useState<PaymentChangeForm>(presets[1].form)
  const [activePreset, setActivePreset] = useState<string | number>(presets[1].id)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const missing = useMemo(() => validateForm(form), [form])

  function setField<K extends keyof PaymentChangeForm>(field: K, value: PaymentChangeForm[K]) {
    setError(null)
    setForm(current => ({ ...current, [field]: value }))
    setActivePreset('custom')
  }

  async function onSubmit() {
    const validation = validateForm(form)
    if (validation.length > 0) {
      setError('Please complete all required fields before sending this request.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = await submitPaymentChange(form)
      onNavigate('detail', result.request.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`Unable to send request to TrustFlow: ${message}`)
      setSubmitting(false)
    }
  }

  return (
    <div className="view-content new-request">
      <div className="section-heading" style={{marginBottom:'2rem'}}>
        <span className="eyebrow">Payment Changes</span>
        <h2>New Payment Change</h2>
      </div>

      <section className="preset-strip" style={{marginBottom:'2rem',display:'flex',gap:'1rem',flexWrap:'wrap'}}>
        {presets.map(preset => (
          <button
            className={`preset-card ${activePreset === preset.id ? 'selected' : ''}`}
            key={preset.id}
            type="button"
            onClick={() => { setActivePreset(preset.id); setForm(preset.form); setError(null); }}
            style={{flex:1,minWidth:'200px',padding:'1rem',textAlign:'left',background:activePreset===preset.id?'#e0e7ff':'white',border:activePreset===preset.id?'1px solid #4f46e5':'1px solid #d1d5db',borderRadius:'8px',cursor:'pointer'}}
          >
            <strong style={{display:'block',color:'#111827'}}>{preset.name} (Quick Template)</strong>
            <span style={{fontSize:'0.75rem',color:'#6b7280'}}>{preset.note}</span>
          </button>
        ))}
        <button
          className={`preset-card ${activePreset === 'custom' ? 'selected' : ''}`}
          type="button"
          onClick={() => { setActivePreset('custom'); setForm(emptyForm); setError(null); }}
          style={{flex:1,minWidth:'200px',padding:'1rem',textAlign:'left',background:activePreset==='custom'?'#e0e7ff':'white',border:activePreset==='custom'?'1px solid #4f46e5':'1px solid #d1d5db',borderRadius:'8px',cursor:'pointer'}}
        >
          <strong style={{display:'block',color:'#111827'}}>Blank Request</strong>
          <span style={{fontSize:'0.75rem',color:'#6b7280'}}>Start from an empty form.</span>
        </button>
      </section>

      <div style={{display:'flex',gap:'2rem',flexWrap:'wrap'}}>
        <section className="form-panel" style={{flex:2,minWidth:'300px'}}>
          <div className="section-heading" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
            <div>
              <span className="eyebrow">Payment details</span>
              <h3 className="small-heading">Request Information</h3>
            </div>
            <span className="draft-pill" style={{background:'#f3f4f6',padding:'0.25rem 0.75rem',borderRadius:'9999px',fontSize:'0.75rem',color:'#4b5563',fontWeight:500}}>Draft upstream request</span>
          </div>

          {error && <div className="error-banner" style={{background:'#fef2f2',color:'#991b1b',padding:'1rem',borderRadius:'6px',display:'flex',gap:'0.5rem',alignItems:'center',marginBottom:'1.5rem'}}><AlertCircle size={18} /> {error}</div>}

          <div className="form-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <Field label="Supplier" value={form.supplier} onChange={value => setField('supplier', value)} />
            <Field label="Invoice Number" value={form.invoiceNumber} onChange={value => setField('invoiceNumber', value)} />
            <Field label="Contract ID" value={form.contractId} onChange={value => setField('contractId', value)} />
            <Field label="Amount" value={form.amount} onChange={value => setField('amount', value)} inputMode="decimal" />
            <Field label="Currency" value={form.currency} onChange={value => setField('currency', value.toUpperCase())} />
            <Field label="Request Domain" value={form.requestDomain} onChange={value => setField('requestDomain', value)} />
            <Field label="Current Payee" value={form.currentPayee} onChange={value => setField('currentPayee', value)} />
            <Field label="Requested Payee" value={form.requestedPayee} onChange={value => setField('requestedPayee', value)} />
            <Field label="Current Bank Account" value={form.currentBankAccount} onChange={value => setField('currentBankAccount', value)} />
            <Field label="Requested Bank Account" value={form.requestedBankAccount} onChange={value => setField('requestedBankAccount', value)} />
            <label className="field field-wide" style={{gridColumn:'1 / -1'}}>
              <span style={{display:'block',fontSize:'0.75rem',color:'#6b7280',marginBottom:'0.25rem',fontWeight:600}}>Change Reason</span>
              <textarea value={form.changeReason} onChange={event => setField('changeReason', event.target.value)} style={{width:'100%',padding:'0.5rem',border:'1px solid #d1d5db',borderRadius:'4px',minHeight:'80px',fontFamily:'inherit'}} />
            </label>
          </div>

          <div className="action-row" style={{marginTop:'2rem',display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'1rem',borderTop:'1px solid #e5e7eb'}}>
            <span style={{color:'#6b7280',fontSize:'0.875rem'}}>{missing.length ? `${missing.length} required fields remaining` : 'Ready to send as unevaluated draft'}</span>
            <button className="primary-action" type="button" onClick={() => { void onSubmit(); }} disabled={submitting} style={{display:'flex',alignItems:'center',gap:'0.5rem',background:'#4f46e5',color:'white',padding:'0.5rem 1rem',borderRadius:'6px',border:'none',cursor:submitting?'not-allowed':'pointer'}}>
              {submitting ? <CircleDashed className="spin" size={18} /> : <Send size={18} />}
              {submitting ? 'Sending...' : 'Send to TrustFlow'}
            </button>
          </div>
        </section>

        <aside className="summary-panel" style={{flex:1,minWidth:'250px'}}>
          <section className="summary-section" style={{marginBottom:'2rem'}}>
            <span className="eyebrow">Supporting Documents</span>
            <h3 className="small-heading" style={{marginBottom:'1rem'}}>{form.documents.length} document{form.documents.length === 1 ? '' : 's'}</h3>
            <div className="document-list" style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              {form.documents.length ? form.documents.map(doc => (
                <div className="document-row" key={`${doc.type}-${doc.filename}`} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f9fafb',padding:'0.75rem',borderRadius:'4px',border:'1px solid #e5e7eb'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                    <FileText size={18} color="#6b7280" />
                    <div>
                      <strong style={{display:'block',fontSize:'0.875rem'}}>{doc.label}</strong>
                      <span style={{fontSize:'0.75rem',color:'#6b7280'}}>{doc.filename}</span>
                    </div>
                  </div>
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" aria-label={`View ${doc.label} PDF`} style={{color:'#4f46e5',fontSize:'0.875rem',display:'flex',alignItems:'center',gap:'0.25rem'}}>
                    View PDF <ArrowUpRight size={14} />
                  </a>
                </div>
              )) : <p className="muted-text">Select a quick template with real PDF references.</p>}
            </div>
          </section>

          <section className="summary-section">
            <span className="eyebrow">Destination change</span>
            <div className="comparison" style={{marginTop:'1rem',display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              <DataLine label="Current Payee" value={form.currentPayee} />
              <DataLine label="Requested Payee" value={form.requestedPayee} emphasized={form.currentPayee !== form.requestedPayee} />
              <DataLine label="Current Bank" value={form.currentBankAccount} />
              <DataLine label="Requested Bank" value={form.requestedBankAccount} emphasized={form.currentBankAccount !== form.requestedBankAccount} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, inputMode }: { label: string; value: string; onChange: (value: string) => void; inputMode?: 'decimal' }) {
  return (
    <label className="field">
      <span style={{display:'block',fontSize:'0.75rem',color:'#6b7280',marginBottom:'0.25rem',fontWeight:600}}>{label}</span>
      <input value={value} onChange={event => onChange(event.target.value)} inputMode={inputMode} style={{width:'100%',padding:'0.5rem',border:'1px solid #d1d5db',borderRadius:'4px',fontFamily:'inherit'}} />
    </label>
  )
}

function DataLine({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div className={`data-line ${emphasized ? 'emphasized' : ''}`} style={{display:'flex',justifyContent:'space-between',fontSize:'0.875rem',padding:'0.25rem 0',color:emphasized?'#b91c1c':'inherit',fontWeight:emphasized?600:400,borderBottom:'1px solid #f3f4f6'}}>
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}