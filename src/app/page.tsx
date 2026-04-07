'use client'
import { useEffect, useState, useRef } from 'react'
const TEST_USER = '00000000-0000-0000-0000-000000000001'
export default function Dashboard() {
  const [dark, setDark] = useState(true)
  const [activeTab, setActiveTab] = useState<'home'|'reports'|'medicines'|'insights'>('home')
  const [medicines, setMedicines] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [healthScore, setHealthScore] = useState(0)
  const [topConcern, setTopConcern] = useState('')
  const [positives, setPositives] = useState<string[]>([])
  const [reportHistory, setReportHistory] = useState<any[]>([])
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [predLoading, setPredLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadedReport, setUploadedReport] = useState<any>(null)
  const [showAddMed, setShowAddMed] = useState(false)
  const [medStatus, setMedStatus] = useState<{[key:string]:'taken'|'missed'}>({})
  const [medForm, setMedForm] = useState({name:'',dosage:'',frequency:'',condition_for:'',prescribed_by:''})
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const t = {
    bg: dark?'#080d1a':'#f4f6fb',
    surface: dark?'#111827':'#ffffff',
    surface2: dark?'#1a2235':'#f0f2f8',
    border: dark?'#1f2937':'#e2e8f0',
    text: dark?'#f0f4ff':'#0f172a',
    text2: dark?'#8b9ab8':'#64748b',
    accent:'#4ade80',
    purple:'#a78bfa',
    cyan:'#22d3ee',
    danger:'#ef4444',
    warning:'#f59e0b',
  }
  useEffect(()=>{fetchMedicines();fetchReports()},[])
  async function fetchMedicines(){
    setLoading(true)
    try{
      const r=await fetch(`/api/medicines?user_id=${TEST_USER}`)
      const d=await r.json()
      setMedicines(d.medicines||[])
    }catch(e){console.error(e)}
    finally{setLoading(false)}
  }
  async function fetchReports(){
    try{
      const r=await fetch(`/api/reports?user_id=${TEST_USER}`)
      const d=await r.json()
      setReportHistory(d.reports||[])
    }catch(e){console.error(e)}
  }
  async function handleUpload(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]
    if(!file)return
    setUploadLoading(true)
    setUploadedReport(null)
    setActiveTab('reports')
    try{
      const fd=new FormData()
      fd.append('file',file)
      fd.append('user_id',TEST_USER)
      const r=await fetch('/api/extract-report',{method:'POST',body:fd})
      const d=await r.json()
      if(d.success){
        setUploadedReport(d)
        fetchReports() // refresh history
      }
      else alert('Error: '+d.error)
    }catch(e){alert('Upload failed')}
    finally{setUploadLoading(false)}
  }
  async function addMedicine(){
    if(!medForm.name.trim())return alert('Name required')
    try{
      const r=await fetch('/api/medicines',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:TEST_USER,...medForm})})
      const d=await r.json()
      if(d.success){setMedicines(p=>[d.medicine,...p]);setMedForm({name:'',dosage:'',frequency:'',condition_for:'',prescribed_by:''});setShowAddMed(false)}
    }catch(e){alert('Failed')}
  }
  async function markStatus(id:string,status:'taken'|'missed'){
    setMedStatus(prev=>({...prev,[id]:status}))
    try{
      await fetch('/api/medicine-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({medicine_id:id,user_id:TEST_USER,status,scheduled_time:new Date().toLocaleTimeString()})})
    }catch(e){console.error(e)}
  }
  async function getPredictions(){
    setPredLoading(true)
    setActiveTab('insights')
    try{
      const r=await fetch(`/api/predict?user_id=${TEST_USER}`)
      const d=await r.json()
      setPredictions(d.predictions||[])
      setHealthScore(d.overall_health_score||0)
      setTopConcern(d.top_concern||'')
      setPositives(d.positive_findings||[])
    }catch(e){console.error(e)}
    finally{setPredLoading(false)}
  }
  const rc=(l:string)=>l==='high'||l==='critical'?t.danger:l==='medium'?t.warning:t.accent
  const fc=(f:string)=>f==='normal'?t.accent:f==='low'?t.warning:t.danger
  const card={background:t.surface,border:`1px solid ${t.border}`,borderRadius:'16px',padding:'20px'}
  const inp={width:'100%',background:t.surface2,border:`1px solid ${t.border}`,borderRadius:'10px',padding:'11px 14px',color:t.text,fontSize:'13px',outline:'none',boxSizing:'border-box' as const,fontFamily:'inherit'}
  return (
    <div style={{minHeight:'100vh',background:t.bg,color:t.text,fontFamily:'system-ui,sans-serif',transition:'all 0.3s'}}>
      {/* NAV */}
      <nav style={{background:t.surface,borderBottom:`1px solid ${t.border}`,padding:'0 24px',height:'60px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <span style={{fontSize:'22px'}}>🌿</span>
          <span style={{fontSize:'19px',fontWeight:'700',color:t.accent}}>Jivayu</span>
          <span style={{fontSize:'10px',color:t.text2,background:t.surface2,padding:'2px 7px',borderRadius:'20px',border:`1px solid ${t.border}`}}>Beta</span>
        </div>
        <div style={{display:'flex',gap:'4px'}}>
          {(['home','reports','medicines','insights'] as const).map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} style={{background:activeTab===tab?t.surface2:'transparent',color:activeTab===tab?t.text:t.text2,border:activeTab===tab?`1px solid ${t.border}`:'1px solid transparent',borderRadius:'8px',padding:'7px 13px',fontWeight:activeTab===tab?600:500,cursor:'pointer',fontSize:'12px',fontFamily:'inherit'}}>
              {tab==='home'?'⊞ Home':tab==='reports'?'🔬 Reports':tab==='medicines'?'💊 Medicines':'🧠 Insights'}
            </button>
          ))}
        </div>
        <button onClick={()=>setDark(!dark)} style={{background:t.surface2,border:`1px solid ${t.border}`,borderRadius:'10px',padding:'8px 14px',cursor:'pointer',fontSize:'13px',color:t.text,fontFamily:'inherit',fontWeight:'500'}}>
          {dark?'☀️ Light':'🌙 Dark'}
        </button>
      </nav>
      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'28px 24px'}}>

        {/* HOME */}
        {activeTab==='home'&&(
          <div>
            <div style={{...card,background:dark?'linear-gradient(135deg,#0d1f1a,#111827)':'linear-gradient(135deg,#f0fdf4,#eff6ff)',border:`1px solid ${dark?'#1a3a2a':'#bbf7d0'}`,marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'16px'}}>
              <div>
                <div style={{fontSize:'13px',color:t.text2,marginBottom:'4px'}}>Welcome to Jivayu 🌿</div>
                <div style={{fontSize:'26px',fontWeight:'800',marginBottom:'6px'}}>Your Health, <span style={{color:t.accent}}>Intelligently</span> Managed</div>
                <div style={{fontSize:'13px',color:t.text2}}>Upload reports · Track medicines · Get AI predictions</div>
              </div>
              {healthScore>0&&<div style={{textAlign:'center',background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.2)',borderRadius:'14px',padding:'14px 22px'}}><div style={{fontSize:'48px',fontWeight:'900',color:t.accent,lineHeight:1}}>{healthScore}</div><div style={{fontSize:'11px',color:t.text2,marginTop:'4px'}}>Health Score</div></div>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'14px',marginBottom:'24px'}}>
              <div style={{...card,border:`1.5px dashed ${dark?'#1a3d2a':'#86efac'}`}}>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}} onChange={handleUpload}/>
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handleUpload}/>
                <div style={{fontSize:'32px',marginBottom:'10px'}}>🔬</div>
                <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'4px'}}>Upload Lab Report</div>
                <div style={{fontSize:'12px',color:t.text2,marginBottom:'12px'}}>PDF, photo or take a picture</div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button onClick={()=>fileRef.current?.click()} style={{flex:1,background:'rgba(74,222,128,0.1)',color:t.accent,border:'1px solid rgba(74,222,128,0.2)',borderRadius:'8px',padding:'8px',fontSize:'12px',cursor:'pointer',fontWeight:'600',fontFamily:'inherit'}}>📁 Upload</button>
                  <button onClick={()=>cameraRef.current?.click()} style={{flex:1,background:'rgba(34,211,238,0.1)',color:t.cyan,border:'1px solid rgba(34,211,238,0.2)',borderRadius:'8px',padding:'8px',fontSize:'12px',cursor:'pointer',fontWeight:'600',fontFamily:'inherit'}}>📷 Camera</button>
                </div>
                {uploadLoading&&<div style={{color:t.accent,fontSize:'12px',marginTop:'8px'}}>🧠 Reading...</div>}
              </div>
              <div onClick={()=>setShowAddMed(true)} style={{...card,border:`1.5px dashed ${dark?'#2d1f4d':'#c4b5fd'}`,cursor:'pointer'}}>
                <div style={{fontSize:'32px',marginBottom:'10px'}}>💊</div>
                <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'4px'}}>Add Medicine</div>
                <div style={{fontSize:'12px',color:t.text2}}>Track daily medicines</div>
              </div>
              <div onClick={getPredictions} style={{...card,border:`1.5px dashed ${dark?'#2d2510':'#fde68a'}`,cursor:'pointer'}}>
                <div style={{fontSize:'32px',marginBottom:'10px'}}>🧠</div>
                <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'4px'}}>AI Predictions</div>
                <div style={{fontSize:'12px',color:t.text2}}>{predLoading?'Analysing...':'Get risk analysis'}</div>
              </div>
            </div>
            {medicines.length>0&&(
              <div>
                <div style={{fontSize:'11px',fontWeight:'700',color:t.text2,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'10px',display:'flex',justifyContent:'space-between'}}>
                  <span>Today's Medicines</span>
                  <button onClick={()=>setActiveTab('medicines')} style={{background:'none',border:'none',color:t.accent,fontSize:'12px',cursor:'pointer',fontFamily:'inherit'}}>See all →</button>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {medicines.slice(0,3).map((m:any)=>(
                    <div key={m.id} style={{...card,display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px'}}>
                      <span style={{fontSize:'20px'}}>💊</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'13px',fontWeight:'600'}}>{m.name}</div>
                        <div style={{fontSize:'11px',color:t.text2}}>{m.dosage} · {m.frequency}</div>
                      </div>
                      <div style={{display:'flex',gap:'6px'}}>
                        <button onClick={()=>markStatus(m.id,'taken')} style={{background:medStatus[m.id]==='taken'?'#16a34a':'rgba(74,222,128,0.1)',color:medStatus[m.id]==='taken'?'#fff':t.accent,border:'1px solid rgba(74,222,128,0.3)',borderRadius:'8px',padding:'6px 10px',fontSize:'11px',cursor:'pointer',fontWeight:'700',fontFamily:'inherit',transition:'all 0.2s'}}>✓ Taken</button>
                        <button onClick={()=>markStatus(m.id,'missed')} style={{background:medStatus[m.id]==='missed'?'#dc2626':'rgba(239,68,68,0.1)',color:medStatus[m.id]==='missed'?'#fff':t.danger,border:'1px solid rgba(239,68,68,0.3)',borderRadius:'8px',padding:'6px 10px',fontSize:'11px',cursor:'pointer',fontWeight:'700',fontFamily:'inherit',transition:'all 0.2s'}}>✗ Missed</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {topConcern&&<div style={{...card,marginTop:'16px',background:'rgba(245,158,11,0.05)',border:'1px solid rgba(245,158,11,0.2)'}}>
              <div style={{fontSize:'11px',color:t.warning,fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'6px'}}>⚠️ AI Health Alert</div>
              <div style={{fontSize:'13px',lineHeight:1.7}}>{topConcern}</div>
            </div>}
          </div>
        )}

        {/* REPORTS */}
        {activeTab==='reports'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
              <div><h1 style={{fontSize:'22px',fontWeight:'800',marginBottom:'4px'}}>Lab Reports</h1><p style={{fontSize:'13px',color:t.text2}}>Upload any report — AI reads and explains instantly</p></div>
              <div style={{display:'flex',gap:'8px'}}>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}} onChange={handleUpload}/>
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handleUpload}/>
                <button onClick={()=>cameraRef.current?.click()} style={{background:'rgba(34,211,238,0.1)',color:t.cyan,border:'1px solid rgba(34,211,238,0.2)',borderRadius:'10px',padding:'10px 16px',fontWeight:'700',cursor:'pointer',fontSize:'13px',fontFamily:'inherit'}}>📷 Camera</button>
                <button onClick={()=>fileRef.current?.click()} style={{background:t.accent,color:'#0a0f1e',border:'none',borderRadius:'10px',padding:'10px 18px',fontWeight:'700',cursor:'pointer',fontSize:'13px',fontFamily:'inherit'}}>{uploadLoading?'🧠 Reading...':'📁 Upload File'}</button>
              </div>
            </div>
            {uploadLoading&&<div style={{...card,textAlign:'center',padding:'60px 20px'}}><div style={{fontSize:'48px',marginBottom:'16px'}}>🧠</div><div style={{fontSize:'16px',fontWeight:'700',color:t.accent}}>Claude is reading your report...</div><div style={{fontSize:'12px',color:t.text2,marginTop:'6px'}}>15-20 seconds</div></div>}
            {uploadedReport&&!uploadLoading&&(
              <div>
                <div style={{...card,marginBottom:'14px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}}>
                    <div><div style={{fontSize:'17px',fontWeight:'800'}}>{uploadedReport.structured?.report_name}</div><div style={{fontSize:'12px',color:t.text2}}>{uploadedReport.structured?.lab_name}</div></div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <span style={{background:'rgba(74,222,128,0.1)',color:t.accent,padding:'4px 12px',borderRadius:'20px',fontSize:'11px',fontWeight:'700'}}>{uploadedReport.structured?.summary?.normal_count} Normal</span>
                      <span style={{background:'rgba(239,68,68,0.1)',color:t.danger,padding:'4px 12px',borderRadius:'20px',fontSize:'11px',fontWeight:'700'}}>{uploadedReport.structured?.summary?.abnormal_count} Abnormal</span>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {(uploadedReport.structured?.parameters||[]).map((p:any,i:number)=>(
                      <div key={i} style={{display:'grid',gridTemplateColumns:'1fr auto auto auto',alignItems:'center',gap:'10px',padding:'9px 12px',background:t.surface2,borderRadius:'8px'}}>
                        <div><span style={{fontSize:'13px',fontWeight:'500'}}>{p.name}</span><span style={{fontSize:'11px',color:t.text2,marginLeft:'5px'}}>{p.unit}</span></div>
                        <div style={{fontSize:'14px',fontWeight:'700'}}>{p.value}</div>
                        <div style={{fontSize:'11px',color:t.text2}}>{p.reference_min}–{p.reference_max}</div>
                        <div style={{fontSize:'10px',fontWeight:'700',padding:'3px 9px',borderRadius:'20px',background:`${fc(p.flag)}18`,color:fc(p.flag),minWidth:'60px',textAlign:'center'}}>{p.flag}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{background:'rgba(34,211,238,0.05)',border:'1px solid rgba(34,211,238,0.15)',borderRadius:'14px',padding:'18px',marginBottom:'12px'}}>
                  <div style={{fontSize:'11px',color:t.cyan,fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'8px'}}>🧠 English Explanation</div>
                  <div style={{fontSize:'13px',lineHeight:1.8}}>{uploadedReport.explanation_en}</div>
                </div>
                {uploadedReport.explanation_hi&&<div style={{background:'rgba(167,139,250,0.05)',border:'1px solid rgba(167,139,250,0.15)',borderRadius:'14px',padding:'18px'}}>
                  <div style={{fontSize:'11px',color:t.purple,fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'8px'}}>🧠 हिंदी में समझें</div>
                  <div style={{fontSize:'13px',lineHeight:1.9}}>{uploadedReport.explanation_hi}</div>
                </div>}
              </div>
            )}
            {!uploadedReport&&!uploadLoading&&(
              <div style={{...card,textAlign:'center',padding:'70px 20px',border:`1.5px dashed ${t.border}`}}>
                <div style={{fontSize:'48px',marginBottom:'14px'}}>🔬</div>
                <div style={{fontSize:'17px',fontWeight:'700',marginBottom:'8px'}}>Upload your first report</div>
                <div style={{fontSize:'13px',color:t.text2,marginBottom:'20px'}}>PDF or photo · Hindi or English · Any Indian lab</div>
                <div style={{display:'flex',gap:'10px',justifyContent:'center',flexWrap:'wrap'}}>
                  <button onClick={()=>fileRef.current?.click()} style={{background:'rgba(74,222,128,0.1)',color:t.accent,border:'1px solid rgba(74,222,128,0.2)',borderRadius:'10px',padding:'10px 20px',fontSize:'13px',cursor:'pointer',fontWeight:'600',fontFamily:'inherit'}}>📁 Upload PDF or Photo</button>
                  <button onClick={()=>cameraRef.current?.click()} style={{background:'rgba(34,211,238,0.1)',color:t.cyan,border:'1px solid rgba(34,211,238,0.2)',borderRadius:'10px',padding:'10px 20px',fontSize:'13px',cursor:'pointer',fontWeight:'600',fontFamily:'inherit'}}>📷 Take Photo with Camera</button>
                </div>
              </div>
            )}
          </div>

            {/* REPORT HISTORY */}
            {reportHistory.length>0&&(
              <div style={{marginTop:'24px'}}>
                <div style={{fontSize:'11px',fontWeight:'700',color:t.text2,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'12px'}}>📋 All Reports ({reportHistory.length})</div>
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {reportHistory.map((rep:any)=>{
                    const abnormal=(rep.parameters||[]).filter((p:any)=>p.flag&&p.flag!=='normal').length
                    const total=(rep.parameters||[]).length
                    const date=new Date(rep.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
                    const isSelected=selectedReport?.id===rep.id
                    return(
                      <div key={rep.id}>
                        <div onClick={()=>setSelectedReport(isSelected?null:rep)} style={{...card,cursor:'pointer',border:isSelected?`1px solid ${t.accent}`:`1px solid ${t.border}`}}>
                          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                            <div style={{width:'42px',height:'42px',background:abnormal>0?'rgba(239,68,68,0.1)':'rgba(74,222,128,0.1)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',flexShrink:0}}>{abnormal>0?'⚠️':'✅'}</div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'2px'}}>{rep.report_name||'Lab Report'}</div>
                              <div style={{fontSize:'12px',color:t.text2}}>{rep.lab_name||'Lab'} · {date}</div>
                            </div>
                            <div style={{display:'flex',gap:'6px',alignItems:'center',flexShrink:0}}>
                              {abnormal>0&&<span style={{background:'rgba(239,68,68,0.1)',color:t.danger,padding:'3px 9px',borderRadius:'20px',fontSize:'10px',fontWeight:'700'}}>{abnormal} Abnormal</span>}
                              <span style={{background:'rgba(74,222,128,0.1)',color:t.accent,padding:'3px 9px',borderRadius:'20px',fontSize:'10px',fontWeight:'700'}}>{total} Tests</span>
                              <span style={{color:t.text2,fontSize:'14px'}}>{isSelected?'▲':'▼'}</span>
                            </div>
                          </div>
                        </div>
                        {isSelected&&(
                          <div style={{background:t.surface,border:`1px solid ${t.accent}`,borderTop:'none',borderRadius:'0 0 16px 16px',padding:'16px',marginTop:'-4px'}}>
                            <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                              {(rep.parameters||[]).map((p:any,i:number)=>(
                                <div key={i} style={{display:'grid',gridTemplateColumns:'1fr auto auto auto',alignItems:'center',gap:'10px',padding:'8px 12px',background:t.surface2,borderRadius:'8px'}}>
                                  <div><span style={{fontSize:'12px',fontWeight:'500'}}>{p.name}</span><span style={{fontSize:'10px',color:t.text2,marginLeft:'4px'}}>{p.unit}</span></div>
                                  <div style={{fontSize:'13px',fontWeight:'700'}}>{p.value}</div>
                                  <div style={{fontSize:'10px',color:t.text2}}>{p.reference_min}–{p.reference_max}</div>
                                  <div style={{fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'20px',background:`${fc(p.flag||'normal')}18`,color:fc(p.flag||'normal'),minWidth:'52px',textAlign:'center'}}>{p.flag||'–'}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
        )}

        {/* MEDICINES */}
        {activeTab==='medicines'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
              <div><h1 style={{fontSize:'22px',fontWeight:'800',marginBottom:'4px'}}>Medicine Tracker</h1><p style={{fontSize:'13px',color:t.text2}}>{medicines.length} medicines tracked</p></div>
              <button onClick={()=>setShowAddMed(true)} style={{background:t.purple,color:'#fff',border:'none',borderRadius:'10px',padding:'10px 18px',fontWeight:'700',cursor:'pointer',fontSize:'13px',fontFamily:'inherit'}}>+ Add Medicine</button>
            </div>
            {loading?<div style={{color:t.text2,textAlign:'center',padding:'40px'}}>Loading...</div>:
            medicines.length===0?(
              <div onClick={()=>setShowAddMed(true)} style={{...card,textAlign:'center',padding:'70px 20px',border:`1.5px dashed ${t.border}`,cursor:'pointer'}}>
                <div style={{fontSize:'48px',marginBottom:'14px'}}>💊</div>
                <div style={{fontSize:'17px',fontWeight:'700',marginBottom:'8px'}}>Add your first medicine</div>
                <div style={{fontSize:'13px',color:t.text2}}>Track medicines and mark taken or missed daily</div>
              </div>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'14px'}}>
                {medicines.map((m:any)=>(
                  <div key={m.id} style={card}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
                      <span style={{fontSize:'30px'}}>💊</span>
                      <span style={{background:'rgba(74,222,128,0.1)',color:t.accent,padding:'3px 10px',borderRadius:'20px',fontSize:'10px',fontWeight:'700',border:'1px solid rgba(74,222,128,0.2)'}}>Active</span>
                    </div>
                    <div style={{fontSize:'15px',fontWeight:'700',marginBottom:'4px'}}>{m.name}</div>
                    {m.dosage&&<div style={{fontSize:'12px',color:t.text2,marginBottom:'2px'}}>{m.dosage} · {m.frequency}</div>}
                    {m.condition_for&&<div style={{fontSize:'11px',color:t.accent,marginBottom:'2px'}}>For: {m.condition_for}</div>}
                    {m.prescribed_by&&<div style={{fontSize:'11px',color:t.text2,marginBottom:'12px'}}>Dr: {m.prescribed_by}</div>}
                    <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
                      <button onClick={()=>markStatus(m.id,'taken')} style={{flex:1,background:medStatus[m.id]==='taken'?'#16a34a':'rgba(74,222,128,0.1)',color:medStatus[m.id]==='taken'?'#fff':t.accent,border:'1px solid rgba(74,222,128,0.3)',borderRadius:'8px',padding:'9px',fontSize:'12px',cursor:'pointer',fontWeight:'700',fontFamily:'inherit',transition:'all 0.2s'}}>
                        {medStatus[m.id]==='taken'?'✓ Taken!':'✓ Mark Taken'}
                      </button>
                      <button onClick={()=>markStatus(m.id,'missed')} style={{flex:1,background:medStatus[m.id]==='missed'?'#dc2626':'rgba(239,68,68,0.1)',color:medStatus[m.id]==='missed'?'#fff':t.danger,border:'1px solid rgba(239,68,68,0.3)',borderRadius:'8px',padding:'9px',fontSize:'12px',cursor:'pointer',fontWeight:'700',fontFamily:'inherit',transition:'all 0.2s'}}>
                        {medStatus[m.id]==='missed'?'✗ Missed!':'✗ Missed'}
                      </button>
                    </div>
                  </div>
                ))}
                <div onClick={()=>setShowAddMed(true)} style={{...card,border:`1.5px dashed ${t.border}`,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'180px',gap:'8px',color:t.text2}}>
                  <div style={{fontSize:'28px'}}>+</div>
                  <div style={{fontSize:'13px'}}>Add medicine</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INSIGHTS */}
        {activeTab==='insights'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
              <div><h1 style={{fontSize:'22px',fontWeight:'800',marginBottom:'4px'}}>AI Health Insights</h1><p style={{fontSize:'13px',color:t.text2}}>Personalised predictions from your health data</p></div>
              <button onClick={getPredictions} style={{background:t.accent,color:'#0a0f1e',border:'none',borderRadius:'10px',padding:'10px 18px',fontWeight:'700',cursor:'pointer',fontSize:'13px',fontFamily:'inherit'}}>{predLoading?'🧠 Analysing...':'🧠 Refresh'}</button>
            </div>
            {healthScore>0&&(
              <div style={{...card,background:dark?'linear-gradient(135deg,#0d1f1a,#111827)':'linear-gradient(135deg,#f0fdf4,#eff6ff)',border:`1px solid ${dark?'#1a3a2a':'#bbf7d0'}`,marginBottom:'20px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'20px',flexWrap:'wrap'}}>
                  <div style={{fontSize:'60px',fontWeight:'900',color:t.accent,lineHeight:1}}>{healthScore}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'16px',fontWeight:'700',marginBottom:'8px'}}>Health Intelligence Score</div>
                    <div style={{height:'8px',background:t.border,borderRadius:'10px',marginBottom:'10px',overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${healthScore}%`,background:'linear-gradient(90deg,#ef4444 0%,#f59e0b 50%,#4ade80 100%)',borderRadius:'10px'}}></div>
                    </div>
                    {topConcern&&<div style={{fontSize:'13px',color:t.warning}}>⚠️ {topConcern}</div>}
                  </div>
                </div>
                {positives.length>0&&<div style={{marginTop:'14px',borderTop:`1px solid ${t.border}`,paddingTop:'12px'}}>
                  <div style={{fontSize:'11px',color:t.accent,fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'6px'}}>✓ Positive Findings</div>
                  {positives.map((p:string,i:number)=><div key={i} style={{fontSize:'12px',color:t.text2,marginBottom:'3px'}}>• {p}</div>)}
                </div>}
              </div>
            )}
            {predictions.length===0?(
              <div style={{...card,textAlign:'center',padding:'70px 20px',border:`1.5px dashed ${t.border}`}}>
                <div style={{fontSize:'48px',marginBottom:'14px'}}>🧠</div>
                <div style={{fontSize:'17px',fontWeight:'700',marginBottom:'8px'}}>No predictions yet</div>
                <div style={{fontSize:'13px',color:t.text2,marginBottom:'20px'}}>Upload a lab report first then click Refresh</div>
                <button onClick={getPredictions} style={{background:t.accent,color:'#0a0f1e',border:'none',borderRadius:'10px',padding:'12px 24px',fontWeight:'700',cursor:'pointer',fontSize:'14px',fontFamily:'inherit'}}>{predLoading?'Analysing...':'Get Predictions'}</button>
              </div>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'14px'}}>
                {predictions.map((pred:any,i:number)=>(
                  <div key={i} style={{...card,border:`1px solid ${rc(pred.risk_level)}33`,borderLeft:`4px solid ${rc(pred.risk_level)}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                      <div style={{fontSize:'30px',fontWeight:'900',color:rc(pred.risk_level),lineHeight:1}}>{pred.risk_percent}%</div>
                      <span style={{fontSize:'10px',fontWeight:'800',padding:'3px 9px',borderRadius:'20px',background:`${rc(pred.risk_level)}18`,color:rc(pred.risk_level),textTransform:'uppercase'}}>{pred.risk_level}</span>
                    </div>
                    <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'6px'}}>{pred.condition}</div>
                    <div style={{fontSize:'12px',color:t.text2,lineHeight:1.7,marginBottom:'12px'}}>{pred.reasoning}</div>
                    <div style={{borderTop:`1px solid ${t.border}`,paddingTop:'10px'}}>
                      <div style={{fontSize:'10px',color:t.text2,fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'6px'}}>What to do</div>
                      {(pred.recommendations||[]).slice(0,2).map((r:string,j:number)=>(
                        <div key={j} style={{fontSize:'12px',marginBottom:'5px',paddingLeft:'10px',borderLeft:`2px solid ${rc(pred.risk_level)}`,lineHeight:1.5}}>{r}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD MEDICINE MODAL */}
      {showAddMed&&(
        <div onClick={(e)=>e.target===e.currentTarget&&setShowAddMed(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:'20px',backdropFilter:'blur(6px)'}}>
          <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:'20px',padding:'28px',width:'100%',maxWidth:'460px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <div style={{fontSize:'18px',fontWeight:'800'}}>💊 Add Medicine</div>
              <button onClick={()=>setShowAddMed(false)} style={{background:'none',border:'none',color:t.text2,fontSize:'22px',cursor:'pointer',lineHeight:1}}>×</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div><div style={{fontSize:'11px',color:t.text2,fontWeight:'600',marginBottom:'4px',textTransform:'uppercase'}}>Medicine Name *</div><input style={inp} placeholder="e.g. Metformin 500mg" value={medForm.name} onChange={e=>setMedForm(p=>({...p,name:e.target.value}))}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <div><div style={{fontSize:'11px',color:t.text2,fontWeight:'600',marginBottom:'4px',textTransform:'uppercase'}}>Dosage</div><input style={inp} placeholder="500mg" value={medForm.dosage} onChange={e=>setMedForm(p=>({...p,dosage:e.target.value}))}/></div>
                <div><div style={{fontSize:'11px',color:t.text2,fontWeight:'600',marginBottom:'4px',textTransform:'uppercase'}}>Frequency</div><input style={inp} placeholder="twice daily" value={medForm.frequency} onChange={e=>setMedForm(p=>({...p,frequency:e.target.value}))}/></div>
              </div>
              <div><div style={{fontSize:'11px',color:t.text2,fontWeight:'600',marginBottom:'4px',textTransform:'uppercase'}}>For Condition</div><input style={inp} placeholder="Blood Sugar Control" value={medForm.condition_for} onChange={e=>setMedForm(p=>({...p,condition_for:e.target.value}))}/></div>
              <div><div style={{fontSize:'11px',color:t.text2,fontWeight:'600',marginBottom:'4px',textTransform:'uppercase'}}>Prescribed By</div><input style={inp} placeholder="Dr. Sharma" value={medForm.prescribed_by} onChange={e=>setMedForm(p=>({...p,prescribed_by:e.target.value}))}/></div>
              <div style={{display:'flex',gap:'10px',marginTop:'4px'}}>
                <button onClick={()=>setShowAddMed(false)} style={{flex:1,background:t.surface2,color:t.text2,border:`1px solid ${t.border}`,borderRadius:'10px',padding:'12px',cursor:'pointer',fontSize:'13px',fontFamily:'inherit'}}>Cancel</button>
                <button onClick={addMedicine} style={{flex:2,background:t.purple,color:'#fff',border:'none',borderRadius:'10px',padding:'12px',cursor:'pointer',fontSize:'14px',fontFamily:'inherit',fontWeight:'700'}}>Save Medicine</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
