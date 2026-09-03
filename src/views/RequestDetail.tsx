import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowUpRight, FileText } from 'lucide-react'
import { getRequest, getDocuments, getEffectiveDecision, type CreatedRequest, type CreatedDocument, getVendors, type Vendor, TRUSTFLOW_APP_BASE_URL } from '../trustflowApi'

export function RequestDetail({ id, onNavigate }: { id: number; onNavigate: (view: string) => void }) {
  const [request, setRequest] = useState<CreatedRequest | null>(null)
  const [documents, setDocuments] = useState<CreatedDocument[]>([])
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      const req = await getRequest(id)
      setRequest(req)
      const [docs, vends] = await Promise.all([
        getDocuments(id),
        getVendors()
      ])
      setDocuments(docs)
      setVendor(vends.find(v => v.id === req.vendor_id) || null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading || !request) return <div className="loading-state">Loading details...</div>

  const status = getEffectiveDecision(request)
  const trustFlowUrl = `${TRUSTFLOW_APP_BASE_URL}/requests/${request.id}`

  return (
    <div className="view-content request-detail">
      <div style={{marginBottom:'1.5rem'}}>
        <button style={{background:'transparent',border:'none',color:'#4f46e5',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.25rem',padding:0}} onClick={() => onNavigate('list')}>
          <ArrowLeft size={16} /> Back to Payment Changes
        </button>
      </div>

      <div className="section-heading" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'2rem'}}>
        <div>
          <span className="eyebrow">{request.request_key}</span>
          <h2>Payment Destination Change</h2>
          <div style={{marginTop:'0.5rem',color:'#6b7280'}}>
            Created {new Date(request.created_at).toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:'2rem',flexWrap:'wrap'}}>
        <div style={{flex:'2',minWidth:'300px'}}>
          <section className="form-panel" style={{marginBottom:'2rem'}}>
            <h3 className="small-heading" style={{marginBottom:'1rem',paddingBottom:'0.5rem',borderBottom:'1px solid #e5e7eb'}}>Payment Details</h3>
            <div className="detail-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <div><strong style={{display:'block',fontSize:'0.75rem',color:'#6b7280',textTransform:'uppercase'}}>Supplier</strong><div>{vendor?.legal_name || 'Unknown'}</div></div>
              <div><strong style={{display:'block',fontSize:'0.75rem',color:'#6b7280',textTransform:'uppercase'}}>Invoice</strong><div>{request.invoice_number || '-'}</div></div>
              <div><strong style={{display:'block',fontSize:'0.75rem',color:'#6b7280',textTransform:'uppercase'}}>Contract</strong><div>{request.contract_id || '-'}</div></div>
              <div><strong style={{display:'block',fontSize:'0.75rem',color:'#6b7280',textTransform:'uppercase'}}>Amount</strong><div>{new Intl.NumberFormat('en-US', { style: 'currency', currency: request.currency || 'USD' }).format(request.amount || 0)}</div></div>
            </div>
          </section>

          <section className="form-panel" style={{marginBottom:'2rem'}}>
            <h3 className="small-heading" style={{marginBottom:'1rem',paddingBottom:'0.5rem',borderBottom:'1px solid #e5e7eb'}}>Destination Change</h3>
            <div className="detail-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <div><strong style={{display:'block',fontSize:'0.75rem',color:'#6b7280',textTransform:'uppercase'}}>Current Payee</strong><div>{vendor?.current_payee_name || '-'}</div></div>
              <div><strong style={{display:'block',fontSize:'0.75rem',color:'#6b7280',textTransform:'uppercase'}}>Requested Payee</strong><div>{request.requested_payee_name || '-'}</div></div>
              <div><strong style={{display:'block',fontSize:'0.75rem',color:'#6b7280',textTransform:'uppercase'}}>Current Bank</strong><div>{vendor?.current_bank_account || '-'}</div></div>
              <div><strong style={{display:'block',fontSize:'0.75rem',color:'#6b7280',textTransform:'uppercase'}}>Requested Bank</strong><div>{request.requested_bank_account || '-'}</div></div>
            </div>
          </section>

          <section className="form-panel">
            <h3 className="small-heading" style={{marginBottom:'1rem',paddingBottom:'0.5rem',borderBottom:'1px solid #e5e7eb'}}>Reason & Documents</h3>
            <div style={{marginBottom:'1.5rem'}}>
              <strong style={{display:'block',fontSize:'0.75rem',color:'#6b7280',textTransform:'uppercase'}}>Change Reason</strong>
              <p style={{marginTop:'0.25rem',background:'#f9fafb',padding:'0.75rem',borderRadius:'4px'}}>{request.change_reason || 'No reason provided.'}</p>
            </div>
            <div>
              <strong style={{display:'block',fontSize:'0.75rem',color:'#6b7280',textTransform:'uppercase'}}>Supporting Documents ({documents.length})</strong>
              <div style={{marginTop:'0.5rem',display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                {documents.map(doc => (
                  <div key={doc.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f9fafb',padding:'0.75rem',borderRadius:'4px',border:'1px solid #e5e7eb'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                      <FileText size={16} color="#6b7280" />
                      <div>
                        <div style={{fontWeight:500}}>{doc.filename}</div>
                        <div style={{fontSize:'0.75rem',color:'#6b7280'}}>{doc.document_type} • {doc.processing_status}</div>
                      </div>
                    </div>
                    <a href={doc.file_url} target="_blank" rel="noreferrer" style={{color:'#4f46e5',fontSize:'0.875rem'}}>View Document</a>
                  </div>
                ))}
                {documents.length === 0 && <p className="muted-text">No documents attached.</p>}
              </div>
            </div>
          </section>
        </div>

        <aside style={{flex:'1',minWidth:'250px'}}>
          <section className="summary-panel" style={{position:'sticky',top:'2rem'}}>
            <span className="eyebrow">TrustFlow Verification</span>
            <h2 style={{marginTop:'0.25rem',marginBottom:'1rem',fontSize:'1.25rem'}}>{request.request_key}</h2>
            
            <div style={{marginBottom:'1.5rem',background:'#f9fafb',padding:'1rem',borderRadius:'6px',border:'1px solid #e5e7eb'}}>
              <div style={{fontSize:'0.875rem',color:'#6b7280',marginBottom:'0.25rem'}}>Current Status</div>
              <div style={{fontSize:'1.125rem',fontWeight:600}} className={`status-text status-${status.replace(/\s/g, '').toLowerCase()}`}>{status}</div>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              <button 
                className="btn-outline" 
                style={{width:'100%',justifyContent:'center'}}
                onClick={() => { setRefreshing(true); void loadData(); }}
                disabled={refreshing}
              >
                {refreshing ? 'Refreshing...' : 'Refresh Status'}
              </button>
              
              <a 
                href={trustFlowUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="primary-action" 
                style={{textDecoration:'none',display:'flex',justifyContent:'center',alignItems:'center',gap:'0.5rem'}}
              >
                Open in TrustFlow Sentinel <ArrowUpRight size={16} />
              </a>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}