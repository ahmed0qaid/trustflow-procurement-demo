import { useState } from 'react'
import { Building2, LayoutDashboard, ClipboardList, ShieldCheck } from 'lucide-react'
import { Dashboard, RequestList, NewRequest, RequestDetail } from './views'

export function App() {
  const [view, setView] = useState('dashboard')
  const [activeId, setActiveId] = useState<number | undefined>()

  const navigate = (newView: string, id?: number) => {
    setView(newView)
    if (id !== undefined) setActiveId(id)
  }

  let content = null
  if (view === 'dashboard') content = <Dashboard onNavigate={navigate} />
  else if (view === 'list') content = <RequestList onNavigate={navigate} />
  else if (view === 'new') content = <NewRequest onNavigate={navigate} />
  else if (view === 'detail' && activeId) content = <RequestDetail id={activeId} onNavigate={navigate} />

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark"><Building2 size={23} /></div>
          <div>
            <strong>Acme Procurement</strong>
            <span>Payment Change Portal</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => navigate('dashboard')} style={{background:'transparent',border:'none',textAlign:'left',width:'100%',cursor:'pointer'}}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className={`nav-item ${view === 'list' || view === 'detail' || view === 'new' ? 'active' : ''}`} onClick={() => navigate('list')} style={{background:'transparent',border:'none',textAlign:'left',width:'100%',cursor:'pointer'}}>
            <ClipboardList size={18} /> Payment Changes
          </button>
        </nav>

        <div className="side-note" style={{marginTop:'auto',padding:'1rem',background:'#f3f4f6',borderRadius:'8px',fontSize:'0.75rem',color:'#4b5563'}}>
          <strong style={{display:'block',marginBottom:'0.25rem',color:'#111827'}}>Integration Status</strong>
          <div style={{display:'flex',alignItems:'center',gap:'0.25rem',color:'#059669'}}><ShieldCheck size={14}/> TrustFlow Sentinel Connected</div>
          <div style={{marginTop:'0.25rem'}}>Backend: Xano Live</div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Supplier master data</span>
            <h1>Payment Destination Change Request</h1>
          </div>
        </header>

        {content}
      </main>
    </div>
  )
}
