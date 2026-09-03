import { useState, useEffect } from 'react'
import { getRequests, getEffectiveDecision, type CreatedRequest, getVendors, type Vendor } from '../trustflowApi'

export function RequestList({ onNavigate }: { onNavigate: (view: string, id?: number) => void }) {
  const [requests, setRequests] = useState<CreatedRequest[]>([])
  const [vendors, setVendors] = useState<Record<number, Vendor>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    Promise.all([getRequests(), getVendors()]).then(([reqs, vends]) => {
      setRequests(reqs.sort((a, b) => b.id - a.id))
      const vMap: Record<number, Vendor> = {}
      vends.forEach(v => vMap[v.id] = v)
      setVendors(vMap)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="loading-state">Loading requests...</div>

  const filtered = requests.filter(req => {
    if (filter !== 'All' && getEffectiveDecision(req) !== filter) return false
    if (search) {
      const query = search.toLowerCase()
      const supplier = (vendors[req.vendor_id]?.legal_name || '').toLowerCase()
      const key = (req.request_key || '').toLowerCase()
      const invoice = (req.invoice_number || '').toLowerCase()
      if (!supplier.includes(query) && !key.includes(query) && !invoice.includes(query)) return false
    }
    return true
  })

  return (
    <div className="view-content request-list">
      <div className="section-heading" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <div>
          <span className="eyebrow">Payment Changes</span>
          <h2>All Requests</h2>
        </div>
        <button className="primary-action" onClick={() => onNavigate('new')}>
          + New Payment Change
        </button>
      </div>

      <div className="filters" style={{display:'flex',gap:'1rem',marginBottom:'1.5rem'}}>
        <input 
          type="text" 
          placeholder="Search by supplier, key, invoice..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          style={{padding:'0.5rem',border:'1px solid #d1d5db',borderRadius:'4px',flex:1,maxWidth:'300px'}}
        />
        <select 
          value={filter} 
          onChange={e => setFilter(e.target.value)}
          style={{padding:'0.5rem',border:'1px solid #d1d5db',borderRadius:'4px'}}
        >
          <option value="All">All Statuses</option>
          <option value="Pending Verification">Pending Verification</option>
          <option value="Allowed">Allowed</option>
          <option value="Review Required">Review Required</option>
          <option value="Blocked">Blocked</option>
        </select>
      </div>

      {filtered.length === 0 ? <p className="muted-text">No requests match the criteria.</p> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Request</th>
              <th>Supplier</th>
              <th>Invoice</th>
              <th>Requested Payee</th>
              <th>Amount</th>
              <th>TrustFlow Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(req => (
              <tr key={req.id}>
                <td><strong>{req.request_key}</strong></td>
                <td>{vendors[req.vendor_id]?.legal_name || 'Unknown'}</td>
                <td>{req.invoice_number}</td>
                <td>{req.requested_payee_name}</td>
                <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency: req.currency || 'USD' }).format(req.amount || 0)}</td>
                <td><span className={`status-badge status-${getEffectiveDecision(req).replace(/\s/g, '').toLowerCase()}`}>{getEffectiveDecision(req)}</span></td>
                <td>{new Date(req.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn-outline" onClick={() => onNavigate('detail', req.id)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
