import { useState, useEffect } from 'react'
import { getRequests, getEffectiveDecision, type CreatedRequest, getVendors, type Vendor } from '../trustflowApi'

export function Dashboard({ onNavigate }: { onNavigate: (view: string, id?: number) => void }) {
  const [requests, setRequests] = useState<CreatedRequest[]>([])
  const [vendors, setVendors] = useState<Record<number, Vendor>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getRequests(), getVendors()]).then(([reqs, vends]) => {
      setRequests(reqs.sort((a, b) => b.id - a.id))
      const vMap: Record<number, Vendor> = {}
      vends.forEach(v => vMap[v.id] = v)
      setVendors(vMap)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="loading-state">Loading dashboard...</div>

  const stats = {
    total: requests.length,
    pending: requests.filter(r => getEffectiveDecision(r) === 'Pending Verification').length,
    allowed: requests.filter(r => getEffectiveDecision(r) === 'Allowed').length,
    review: requests.filter(r => getEffectiveDecision(r) === 'Review Required').length,
    blocked: requests.filter(r => getEffectiveDecision(r) === 'Blocked').length,
  }

  const recent = requests.slice(0, 5)

  return (
    <div className="view-content dashboard">
      <div className="section-heading" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <span className="eyebrow">Overview</span>
          <h2>Dashboard</h2>
        </div>
        <button className="primary-action" onClick={() => onNavigate('new')}>
          + New Payment Change
        </button>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Requests', value: stats.total },
          { label: 'Pending Verification', value: stats.pending },
          { label: 'Allowed', value: stats.allowed },
          { label: 'Review Required', value: stats.review },
          { label: 'Blocked', value: stats.blocked },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{fontSize:'0.75rem',color:'#6b7280',textTransform:'uppercase',fontWeight:600}}>{s.label}</div>
            <div style={{fontSize:'1.5rem',fontWeight:700,marginTop:'0.25rem'}}>{s.value}</div>
          </div>
        ))}
      </div>

      <h3 className="small-heading" style={{ marginBottom: '1rem' }}>Recent Payment Change Requests</h3>
      {recent.length === 0 ? <p className="muted-text">No requests found.</p> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Request</th>
              <th>Supplier</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(req => (
              <tr key={req.id}>
                <td><strong>{req.request_key}</strong></td>
                <td>{vendors[req.vendor_id]?.legal_name || 'Unknown'}</td>
                <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency: req.currency || 'USD' }).format(req.amount || 0)}</td>
                <td><span className={`status-badge status-${getEffectiveDecision(req).replace(/\s/g, '').toLowerCase()}`}>{getEffectiveDecision(req)}</span></td>
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
