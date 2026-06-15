import React, { useState, useCallback } from "react";
import {
  ArrowUpDown, Search, Settings2, Eraser, BarChart2, FlaskConical,
  Layers, TableProperties, GitMerge, FunctionSquare, LineChart,
  Download, Upload, Bell, Menu, X, Home, Wrench, FileText, Info,
  Undo2, Redo2, Lock, PenLine, ChevronRight, Plus, Star,
  SlidersHorizontal, Eye, Hash, Filter
} from "lucide-react";
import TabManager from "./components/TabManager/TabManager";
import TabContent from "./components/TabManager/TabContent";
import Profile from "./components/Profile";

/* ─── Palette ─────────────────────────────────────────────────────────────── */
const C = {
  yellow:     "#FFF3B0",
  yellowMid:  "#FFD60A",
  yellowDeep: "#F5B800",
  black:      "#1A1A1A",
  grayDark:   "#3D3D3D",
  grayMid:    "#888",
  grayLight:  "#E8E8E8",
  grayLighter:"#F2F2EE",
  white:      "#FFFFFF",
  pageBg:     "#F5F5F0",
};

/* ─── Tool definitions ────────────────────────────────────────────────────── */
const TOOLS = [
  { id:"sort",       name:"Sort Data",      desc:"Sort columns ascending or descending", Icon:ArrowUpDown,      cat:"basics"    },
  { id:"filter",     name:"Filter Data",    desc:"Filter rows by keyword or value",      Icon:Filter,           cat:"basics"    },
  { id:"columns",    name:"Manage Columns", desc:"Show, hide, or rename columns",        Icon:SlidersHorizontal,cat:"basics"    },
  { id:"cleaning",   name:"Clean Data",     desc:"Remove duplicates & empty rows",       Icon:Eraser,           cat:"basics"    },
  { id:"statistics", name:"Statistics",     desc:"Sum, avg, min, max per column",        Icon:BarChart2,        cat:"analytics" },
  { id:"advanced",   name:"Advanced",       desc:"Advanced data operations",             Icon:FlaskConical,     cat:"analytics" },
  { id:"grouping",   name:"Group Data",     desc:"Group rows by column values",          Icon:Layers,           cat:"analytics" },
  { id:"pivot",      name:"Pivot Table",    desc:"Create pivot tables instantly",        Icon:TableProperties,  cat:"analytics" },
  { id:"merge",      name:"Merge Files",    desc:"Combine multiple datasets",            Icon:GitMerge,         cat:"advanced"  },
  { id:"formula",    name:"Formula Column", desc:"Add calculated columns",               Icon:FunctionSquare,   cat:"advanced"  },
  { id:"chart",      name:"Visualize",      desc:"Charts & graphs from your data",       Icon:LineChart,        cat:"advanced"  },
  { id:"download",   name:"Download",       desc:"Export processed data as CSV",         Icon:Download,         cat:"advanced"  },
];

const CATS = [
  { id:"all",       label:"All"       },
  { id:"basics",    label:"Basics"    },
  { id:"analytics", label:"Analytics" },
  { id:"advanced",  label:"Advanced"  },
];

/* ─── Tiny style helpers ──────────────────────────────────────────────────── */
const flex  = (align="center", justify="flex-start", gap=0) =>
  ({ display:"flex", alignItems:align, justifyContent:justify, gap });
const card  = (extra={}) => ({
  background: C.white, borderRadius:16,
  border:`1.5px solid ${C.grayLight}`, ...extra,
});

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [activeTool,     setActiveTool]     = useState(null);
  const [currentView,    setCurrentView]    = useState("home");
  const [activeCat,      setActiveCat]      = useState("all");
  const [mobileTab,      setMobileTab]      = useState("home");

  const [tabs,      setTabs]      = useState([{ id:1, fileName:null, modified:false }]);
  const [activeTab, setActiveTab] = useState(1);
  const [nextId,    setNextId]    = useState(2);

  const [dataSummary,    setDataSummary]    = useState(null);
  const [editMode,       setEditMode]       = useState(false);
  const [history,        setHistory]        = useState({ canUndo:false, canRedo:false, historySize:0 });
  const [displayData,    setDisplayData]    = useState(null);
  const [hiddenCols,     setHiddenCols]     = useState([]);
  const [editToggler,    setEditToggler]    = useState(null);
  const [undoFn,         setUndoFn]         = useState(null);
  const [redoFn,         setRedoFn]         = useState(null);

  const hasFiles = tabs.some(t => t.fileName !== null);

  /* handlers */
  const toggleSidebar  = useCallback(() => setSidebarOpen(p => !p), []);
  const handleTabAdd   = useCallback(() => {
    setTabs(p => [...p, { id:nextId, fileName:null, modified:false }]);
    setActiveTab(nextId); setNextId(p => p+1);
  }, [nextId]);
  const handleTabClose = useCallback((id) => {
    const t = tabs.find(x => x.id===id);
    if (t?.modified && !window.confirm(`Close "${t.fileName||`Tab ${id}`}"? Unsaved changes will be lost.`)) return;
    setTabs(p => { const n=p.filter(x=>x.id!==id); return n.length?n:[{id:nextId,fileName:null,modified:false}]; });
    if (activeTab===id) { const r=tabs.filter(x=>x.id!==id); if(r.length) setActiveTab(r[0].id); }
  }, [tabs, activeTab, nextId]);
  const handleTabChange    = useCallback(id => setActiveTab(id), []);
  const handleFileLoaded   = useCallback((id,name) => setTabs(p=>p.map(t=>t.id===id?{...t,fileName:name,modified:false}:t)),[]);
  const handleDataModified = useCallback(id => setTabs(p=>p.map(t=>t.id===id?{...t,modified:true}:t)),[]);
  const handleToolSelect   = useCallback(id => {
    if (!hasFiles) { alert("Upload a CSV file first."); return; }
    setActiveTool(id); setSidebarOpen(false);
  }, [hasFiles]);

  const filteredTools = activeCat==="all" ? TOOLS : TOOLS.filter(t=>t.cat===activeCat);
  const activeTool_   = TOOLS.find(t=>t.id===activeTool);

  /* ── NAV ITEM ────────────────────────────────────────────────────────────── */
  const NavItem = ({ view, label }) => (
    <button
      onClick={()=>setCurrentView(view)}
      style={{
        padding:"7px 18px", borderRadius:100, border:"none",
        background: currentView===view ? C.black : "transparent",
        color: currentView===view ? C.yellowMid : C.grayDark,
        fontWeight:600, fontSize:13, cursor:"pointer",
        transition:"all 0.2s",
      }}
    >{label}</button>
  );

  /* ── SIDEBAR TOOL ITEM ───────────────────────────────────────────────────── */
  const SidebarTool = ({ tool }) => {
    const active = activeTool===tool.id && hasFiles;
    return (
      <button
        onClick={()=>handleToolSelect(tool.id)}
        style={{
          display:"flex", alignItems:"center", gap:12,
          width:"100%", padding:"10px 14px", borderRadius:12,
          border:"none", textAlign:"left", cursor:"pointer",
          background: active ? C.black : "transparent",
          transition:"all 0.18s", marginBottom:2,
        }}
        onMouseEnter={e=>{ if(!active) e.currentTarget.style.background=C.grayLighter; }}
        onMouseLeave={e=>{ if(!active) e.currentTarget.style.background="transparent"; }}
      >
        <span style={{
          width:34, height:34, borderRadius:10, flexShrink:0,
          background: active ? "#ffffff22" : C.yellow,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <tool.Icon size={16} color={active ? C.yellowMid : C.grayDark} />
        </span>
        <span style={{ flex:1 }}>
          <span style={{ display:"block", fontSize:13, fontWeight:600,
            color: active ? C.yellowMid : C.black }}>{tool.name}</span>
          <span style={{ fontSize:11, color: active ? "#aaa" : C.grayMid,
            lineHeight:1.3 }}>{tool.desc}</span>
        </span>
        {active && <ChevronRight size={14} color={C.yellowMid} />}
      </button>
    );
  };

  /* ── STAT CARD ────────────────────────────────────────────────────────────── */
  const StatCard = ({ label, value, dark, icon: Icon }) => (
    <div style={{
      ...card(), padding:"18px 20px",
      background: dark ? C.black : C.white,
      border: dark ? "none" : `1.5px solid ${C.grayLight}`,
    }}>
      <div style={{ ...flex("center","space-between"), marginBottom:10 }}>
        <span style={{ fontSize:12, fontWeight:600, color: dark ? "#aaa" : C.grayMid,
          textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</span>
        {Icon && <span style={{
          width:28, height:28, borderRadius:8,
          background: dark ? "#ffffff15" : C.yellow,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}><Icon size={14} color={dark ? C.yellowMid : C.yellowDeep} /></span>}
      </div>
      <div style={{ fontSize:28, fontWeight:700, color: dark ? C.yellowMid : C.black }}>
        {value ?? "—"}
      </div>
    </div>
  );

  /* ── TOOL CARD (homepage grid) ───────────────────────────────────────────── */
  const ToolCard = ({ tool, featured }) => {
    const active = activeTool===tool.id && hasFiles;
    return (
      <div
        role="button" tabIndex={0}
        onClick={()=>handleToolSelect(tool.id)}
        onKeyDown={e=>e.key==="Enter"&&handleToolSelect(tool.id)}
        style={{
          ...card(), padding:"20px 18px", cursor:"pointer",
          background: featured ? C.black : (active ? C.yellow : C.white),
          border: active ? `2px solid ${C.yellowDeep}` : (featured ? "none" : `1.5px solid ${C.grayLight}`),
          transition:"all 0.18s",
          boxShadow: active ? `0 0 0 4px ${C.yellowMid}33` : "none",
        }}
        onMouseEnter={e=>{ if(!active&&!featured) e.currentTarget.style.background=C.grayLighter; }}
        onMouseLeave={e=>{ if(!active&&!featured) e.currentTarget.style.background=C.white; }}
      >
        <div style={{
          width:44, height:44, borderRadius:12, marginBottom:14,
          background: featured ? "#ffffff15" : (active ? C.yellowDeep+"22" : C.yellow),
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <tool.Icon size={22} color={featured ? C.yellowMid : (active ? C.yellowDeep : C.grayDark)} />
        </div>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:4,
          color: featured ? C.yellowMid : C.black }}>{tool.name}</div>
        <div style={{ fontSize:12, color: featured ? "#aaa" : C.grayMid,
          lineHeight:1.5 }}>{tool.desc}</div>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight:"100vh", background:C.pageBg,
      fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      color:C.black, WebkitTapHighlightColor:"transparent" }}>

      {/* ── TOP NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        background:C.white, borderBottom:`1px solid ${C.grayLight}`,
        height:60, display:"flex", alignItems:"center",
        justifyContent:"space-between", padding:"0 24px",
        backdropFilter:"blur(8px)",
      }}>
        {/* Left: hamburger + brand */}
        <div style={flex("center","flex-start",14)}>
          <button onClick={toggleSidebar} style={{
            width:38, height:38, borderRadius:10, border:`1.5px solid ${C.grayLight}`,
            background:C.white, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            {sidebarOpen
              ? <X size={18} color={C.black} />
              : <Menu size={18} color={C.black} />}
          </button>
          <div style={{ display:"flex", alignItems:"baseline", gap:2 }}>
            <span style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px", color:C.black }}>D</span>
            <span style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px", color:C.yellowDeep }}>C</span>
            <span style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px", color:C.black }}>P</span>
          </div>
          {/* Active tool badge */}
          {activeTool_ && hasFiles && (
            <div style={{
              display:"flex", alignItems:"center", gap:6,
              background:C.yellow, borderRadius:100, padding:"4px 12px",
              border:`1px solid ${C.yellowDeep}`,
            }}>
              <activeTool_.Icon size={13} color={C.yellowDeep} />
              <span style={{ fontSize:12, fontWeight:600, color:C.grayDark }}>{activeTool_.name}</span>
              <button onClick={()=>setActiveTool(null)} style={{
                border:"none", background:"none", cursor:"pointer", padding:0,
                display:"flex", alignItems:"center",
              }}><X size={12} color={C.grayMid} /></button>
            </div>
          )}
        </div>

        {/* Center: view switcher (hidden on mobile) */}
        <div className="desktop-only" style={{
          display:"flex", gap:2,
          background:C.grayLighter, borderRadius:100, padding:3,
        }}>
          <NavItem view="home"  label="Home"  />
          <NavItem view="about" label="About" />
        </div>

        {/* Right: bell + profile */}
        <div style={flex("center","flex-end",10)}>
          <button style={{
            width:38, height:38, borderRadius:10, border:`1.5px solid ${C.grayLight}`,
            background:C.white, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <Bell size={17} color={C.grayDark} />
          </button>
          <Profile />
        </div>
      </nav>

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          style={{
            position:"fixed", inset:0, background:"rgba(0,0,0,0.35)",
            zIndex:80, backdropFilter:"blur(2px)",
          }}
        />
      )}

      <aside style={{
        position:"fixed", top:60, left:0,
        height:"calc(100vh - 60px)", width:290,
        background:C.white,
        boxShadow: sidebarOpen ? "6px 0 32px rgba(0,0,0,0.12)" : "none",
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition:"transform 0.32s cubic-bezier(0.4,0,0.2,1)",
        zIndex:90, overflowY:"auto",
        borderRight:`1px solid ${C.grayLight}`,
      }}>
        <div style={{ padding:"20px 16px 100px" }}>
          {/* Header */}
          <div style={{ ...flex("center","space-between"), marginBottom:20,
            paddingBottom:16, borderBottom:`1px solid ${C.grayLight}` }}>
            <span style={{ fontSize:15, fontWeight:700 }}>CSV Tools</span>
            <button onClick={toggleSidebar} style={{
              width:30, height:30, borderRadius:"50%", border:`1px solid ${C.grayLight}`,
              background:C.white, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}><X size={14} color={C.grayMid} /></button>
          </div>

          {/* No file warning */}
          {!hasFiles && (
            <div style={{
              background:C.yellow, borderRadius:12, padding:"12px 14px",
              marginBottom:16, border:`1.5px solid ${C.yellowDeep}`,
              display:"flex", gap:10, alignItems:"flex-start",
            }}>
              <Upload size={16} color={C.yellowDeep} style={{ flexShrink:0, marginTop:1 }} />
              <div>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>No file loaded</div>
                <div style={{ fontSize:12, color:C.grayDark }}>Upload a CSV to activate tools.</div>
              </div>
            </div>
          )}

          {/* Category filter */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {CATS.map(c => (
              <button key={c.id} onClick={()=>setActiveCat(c.id)} style={{
                padding:"4px 12px", borderRadius:100, fontSize:12, fontWeight:600,
                border:`1.5px solid ${activeCat===c.id ? C.black : C.grayLight}`,
                background: activeCat===c.id ? C.black : C.white,
                color: activeCat===c.id ? C.yellowMid : C.grayDark,
                cursor:"pointer", transition:"all 0.18s",
              }}>{c.label}</button>
            ))}
          </div>

          {/* Tools list */}
          {(activeCat==="all" ? TOOLS : TOOLS.filter(t=>t.cat===activeCat))
            .map(tool => <SidebarTool key={tool.id} tool={tool} />)}
        </div>
      </aside>

      {/* ── RIGHT PANEL (desktop) ─────────────────────────────────────────────── */}
      <aside className="right-panel" style={{
        position:"fixed", top:60, right:0,
        width:280, height:"calc(100vh - 60px)",
        background:C.white, borderLeft:`1px solid ${C.grayLight}`,
        overflowY:"auto", padding:"20px 16px 80px", zIndex:30,
      }}>
        {/* Dataset overview */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
            letterSpacing:"0.08em", color:C.grayMid, marginBottom:12 }}>
            Dataset
          </div>
          {dataSummary ? (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { label:"Rows",    value:dataSummary.totalRows,                                dark:true,  icon:Hash    },
                { label:"Columns", value:dataSummary.headers.length,                           dark:false, icon:Layers  },
                { label:"Visible", value:dataSummary.headers.length - hiddenCols.length,       dark:false, icon:Eye     },
                { label:"Changes", value:history.historySize,                                  dark:false, icon:FileText},
              ].map(item => (
                <div key={item.label} style={{
                  background: item.dark ? C.black : C.grayLighter,
                  borderRadius:12, padding:"12px 14px",
                }}>
                  <div style={{ fontSize:11, color: item.dark?"#aaa":C.grayMid, marginBottom:4,
                    display:"flex", alignItems:"center", gap:4 }}>
                    <item.icon size={11} />
                    {item.label}
                  </div>
                  <div style={{ fontSize:22, fontWeight:700,
                    color: item.dark ? C.yellowMid : C.black }}>{item.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background:C.grayLighter, borderRadius:12, padding:"20px 14px",
              textAlign:"center" }}>
              <BarChart2 size={28} color={C.grayLight} style={{ margin:"0 auto 8px" }} />
              <p style={{ fontSize:13, color:C.grayMid, margin:0 }}>
                Upload a file to see dataset info
              </p>
            </div>
          )}
        </div>

        {/* Edit mode */}
        {dataSummary && displayData && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
              letterSpacing:"0.08em", color:C.grayMid, marginBottom:12 }}>
              Edit Mode
            </div>
            <div style={{ background:C.grayLighter, borderRadius:12, padding:"14px" }}>
              <div style={{ ...flex("center","flex-start",8), marginBottom:10 }}>
                <div style={{
                  width:8, height:8, borderRadius:"50%",
                  background: editMode ? "#22c55e" : C.grayLight,
                  boxShadow: editMode ? "0 0 0 3px #22c55e33" : "none",
                }} />
                <span style={{ fontSize:13, fontWeight:600 }}>
                  {editMode ? "Editing" : "View only"}
                </span>
              </div>
              <p style={{ fontSize:12, color:C.grayMid, marginBottom:12, lineHeight:1.5 }}>
                {editMode ? "Double-click any cell to edit." : "Enable editing to modify data."}
              </p>
              <button
                onClick={() => editToggler && editToggler()}
                style={{
                  width:"100%", padding:"10px 0", borderRadius:10, border:"none",
                  background: editMode ? C.grayDark : C.black,
                  color: C.yellowMid, fontWeight:700, fontSize:13, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}
              >
                {editMode
                  ? <><Lock size={14}/> Lock Table</>
                  : <><PenLine size={14}/> Enable Editing</>}
              </button>
            </div>
          </div>
        )}

        {/* Undo / Redo */}
        {dataSummary && displayData && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
              letterSpacing:"0.08em", color:C.grayMid, marginBottom:12 }}>
              History
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
              {[
                { label:"Undo", fn:undoFn, can:history.canUndo, Icon:Undo2 },
                { label:"Redo", fn:redoFn, can:history.canRedo, Icon:Redo2 },
              ].map(b => (
                <button key={b.label}
                  onClick={() => b.fn && b.fn()}
                  disabled={!b.can}
                  style={{
                    padding:"10px 0", borderRadius:10, border:"none", fontWeight:600,
                    fontSize:13, cursor: b.can ? "pointer" : "not-allowed",
                    background: b.can ? C.black : C.grayLight,
                    color: b.can ? C.yellowMid : C.grayMid,
                    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                    transition:"all 0.18s",
                  }}
                >
                  <b.Icon size={14} />{b.label}
                </button>
              ))}
            </div>
            <div style={{ background:C.yellow, borderRadius:10, padding:"10px 14px",
              textAlign:"center", border:`1px solid ${C.yellowDeep}33` }}>
              <div style={{ fontSize:22, fontWeight:700 }}>{history.historySize}</div>
              <div style={{ fontSize:11, color:C.grayMid }}>
                {history.historySize===1 ? "change saved" : "changes saved"}
              </div>
            </div>
          </div>
        )}

        {/* Keyboard shortcuts */}
        <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
          letterSpacing:"0.08em", color:C.grayMid, marginBottom:10 }}>
          Shortcuts
        </div>
        <div style={{ background:C.grayLighter, borderRadius:12, padding:"12px 14px" }}>
          {[["Undo","Ctrl+Z"],["Redo","Ctrl+Y"],["Edit cell","Dbl-click"]].map(([a,k])=>(
            <div key={a} style={{ ...flex("center","space-between"), marginBottom:8 }}>
              <span style={{ fontSize:12, color:C.grayDark }}>{a}</span>
              <kbd style={{
                background:C.white, border:`1px solid ${C.grayLight}`, borderRadius:6,
                padding:"2px 8px", fontSize:11, fontFamily:"monospace", color:C.grayDark,
              }}>{k}</kbd>
            </div>
          ))}
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <main style={{
        marginTop:60, paddingBottom:88,
        marginLeft:0,        /* sidebar overlays, doesn't push */
        paddingRight:0,      /* right panel handled via CSS class */
      }} className="main-with-right-panel">

        {currentView === "home" ? (<>

          {/* ── HERO STRIP ── */}
          <div style={{ background:C.white, padding:"28px 32px 0",
            borderBottom:`1px solid ${C.grayLight}` }}>
            <div style={{ maxWidth:900, margin:"0 auto" }}>
              <p style={{ fontSize:13, color:C.grayMid, marginBottom:6 }}>
                Good day 👋
              </p>
              <h1 style={{ fontSize:32, fontWeight:800, margin:"0 0 20px",
                letterSpacing:"-0.5px", lineHeight:1.2 }}>
                What will you{" "}
                <span style={{ color:C.yellowDeep }}>process</span> today?
              </h1>

              {/* Search */}
              <div style={{
                display:"flex", alignItems:"center", gap:12,
                background:C.grayLighter, borderRadius:100,
                padding:"12px 20px", maxWidth:560, marginBottom:20,
                border:`1.5px solid transparent`,
                transition:"all 0.2s",
              }}
                onFocus={e=>{ e.currentTarget.style.border=`1.5px solid ${C.yellowDeep}`; e.currentTarget.style.background=C.white; }}
                onBlur={e=>{ e.currentTarget.style.border="1.5px solid transparent"; e.currentTarget.style.background=C.grayLighter; }}
              >
                <Search size={17} color={C.grayMid} />
                <input
                  type="text"
                  placeholder="Search tools, columns, functions…"
                  style={{
                    border:"none", background:"transparent", fontSize:14,
                    color:C.grayDark, width:"100%", outline:"none", fontFamily:"inherit",
                  }}
                />
              </div>

              {/* Category pills */}
              <div style={{ display:"flex", gap:8, paddingBottom:20, overflowX:"auto",
                scrollbarWidth:"none" }}>
                {CATS.map(c => (
                  <button key={c.id} onClick={()=>setActiveCat(c.id)} style={{
                    flexShrink:0, padding:"7px 18px", borderRadius:100, fontSize:13,
                    fontWeight:600, cursor:"pointer", transition:"all 0.18s", border:"none",
                    background: activeCat===c.id ? C.black : C.grayLighter,
                    color: activeCat===c.id ? C.yellowMid : C.grayDark,
                  }}>{c.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* ── PAGE BODY ── */}
          <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 32px" }}>

            {/* Upload zone */}
            {!hasFiles && (
              <div style={{
                borderRadius:20, border:`2px dashed ${C.yellowDeep}`,
                background:C.yellow, padding:"40px 32px", textAlign:"center",
                marginBottom:28, cursor:"pointer",
                transition:"all 0.2s",
              }}
                onMouseEnter={e=>e.currentTarget.style.background="#fff8d0"}
                onMouseLeave={e=>e.currentTarget.style.background=C.yellow}
              >
                <div style={{
                  width:56, height:56, borderRadius:16, background:C.white,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  margin:"0 auto 14px", boxShadow:`0 4px 12px ${C.yellowDeep}33`,
                }}>
                  <Upload size={26} color={C.yellowDeep} />
                </div>
                <div style={{ fontSize:18, fontWeight:700, marginBottom:6 }}>
                  Drop your CSV here
                </div>
                <div style={{ fontSize:14, color:C.grayDark, marginBottom:18 }}>
                  Supports .csv · .tsv · .xlsx up to 50 MB
                </div>
                <button style={{
                  background:C.black, color:C.yellowMid,
                  padding:"12px 32px", borderRadius:100,
                  fontSize:14, fontWeight:700, border:"none", cursor:"pointer",
                  display:"inline-flex", alignItems:"center", gap:8,
                }}>
                  <Upload size={15} /> Browse files
                </button>
              </div>
            )}

            {/* Dataset stats row */}
            {dataSummary && (
              <div style={{
                display:"grid",
                gridTemplateColumns:"repeat(4,1fr)",
                gap:12, marginBottom:28,
              }}>
                <StatCard label="Total Rows"  value={dataSummary.totalRows}                                dark icon={Hash}     />
                <StatCard label="Columns"     value={dataSummary.headers.length}                           icon={Layers}    />
                <StatCard label="Visible"     value={dataSummary.headers.length - hiddenCols.length}       icon={Eye}       />
                <StatCard label="Changes"     value={history.historySize}                                  icon={FileText}  />
              </div>
            )}

            {/* Edit / Undo / Redo action bar */}
            {dataSummary && displayData && (
              <div style={{
                ...card(), padding:"14px 18px",
                display:"flex", alignItems:"center", gap:12, marginBottom:28,
                flexWrap:"wrap",
              }}>
                <button
                  onClick={()=>editToggler && editToggler()}
                  style={{
                    display:"flex", alignItems:"center", gap:8,
                    padding:"10px 20px", borderRadius:10, border:"none",
                    background:C.black, color:C.yellowMid,
                    fontWeight:700, fontSize:13, cursor:"pointer",
                  }}
                >
                  {editMode ? <><Lock size={14}/> Lock Table</> : <><PenLine size={14}/> Enable Editing</>}
                </button>
                <div style={{ width:1, height:28, background:C.grayLight }} />
                {[
                  { label:"Undo", fn:undoFn, can:history.canUndo, Icon:Undo2 },
                  { label:"Redo", fn:redoFn, can:history.canRedo, Icon:Redo2 },
                ].map(b=>(
                  <button key={b.label}
                    onClick={()=>b.fn&&b.fn()} disabled={!b.can}
                    style={{
                      display:"flex", alignItems:"center", gap:7,
                      padding:"10px 18px", borderRadius:10,
                      border:`1.5px solid ${b.can ? C.grayLight : C.grayLight}`,
                      background: b.can ? C.white : C.grayLighter,
                      color: b.can ? C.black : C.grayMid,
                      fontWeight:600, fontSize:13,
                      cursor: b.can ? "pointer" : "not-allowed",
                      transition:"all 0.18s",
                    }}
                  ><b.Icon size={14}/>{b.label}</button>
                ))}
                <div style={{ marginLeft:"auto",
                  fontSize:13, color:C.grayMid, display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{
                    width:8, height:8, borderRadius:"50%",
                    background: editMode ? "#22c55e" : C.grayLight,
                    boxShadow: editMode ? "0 0 0 3px #22c55e33" : "none",
                  }}/>
                  {editMode ? "Editing enabled" : "View only"}
                </div>
              </div>
            )}

            {/* Tool grid */}
            <div style={{ marginBottom:8 }}>
              <div style={{ ...flex("center","space-between"), marginBottom:16 }}>
                <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>Quick Tools</h2>
                <button onClick={toggleSidebar} style={{
                  display:"flex", alignItems:"center", gap:6,
                  background:"none", border:`1.5px solid ${C.grayLight}`,
                  borderRadius:100, padding:"6px 14px", fontSize:13,
                  fontWeight:600, cursor:"pointer", color:C.grayDark,
                }}>
                  <Wrench size={13}/> All tools
                </button>
              </div>
              <div style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",
                gap:12,
              }}>
                {filteredTools.map((tool, i) => (
                  <ToolCard key={tool.id} tool={tool} featured={i===0} />
                ))}
              </div>
            </div>

            {/* Tabs + content */}
            <div style={{ marginTop:36 }}>
              <div style={{ ...flex("center","space-between"), marginBottom:14 }}>
                <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>Open Files</h2>
              </div>

              {/* Tab bar */}
              <div style={{
                display:"flex", gap:6, overflowX:"auto",
                scrollbarWidth:"none", alignItems:"flex-end",
              }}>
                {tabs.map(tab => {
                  const active = activeTab===tab.id;
                  return (
                    <div key={tab.id}
                      style={{
                        flexShrink:0, padding:"8px 16px",
                        borderRadius:"12px 12px 0 0", fontSize:13, fontWeight:600,
                        background: active ? C.white : C.grayLighter,
                        color: active ? C.black : C.grayMid,
                        border:`1.5px solid ${active ? C.grayLight : "transparent"}`,
                        borderBottom:"none", cursor:"pointer",
                        display:"flex", alignItems:"center", gap:8,
                      }}
                      onClick={()=>handleTabChange(tab.id)}
                    >
                      <FileText size={13}/>
                      {tab.modified && <span style={{color:C.yellowDeep,fontSize:10}}>●</span>}
                      {tab.fileName ? tab.fileName.replace(/\.[^.]+$/,"") : `New Tab ${tab.id}`}
                      {tabs.length > 1 && (
                        <span
                          onClick={e=>{e.stopPropagation();handleTabClose(tab.id);}}
                          style={{ color:C.grayMid, cursor:"pointer",
                            display:"flex", alignItems:"center" }}
                        ><X size={12}/></span>
                      )}
                    </div>
                  );
                })}
                <button onClick={handleTabAdd} style={{
                  width:32, height:32, borderRadius:10,
                  border:`1.5px solid ${C.grayLight}`, background:C.white,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  cursor:"pointer", color:C.grayMid, alignSelf:"center",
                }}><Plus size={15}/></button>
              </div>

              {/* Content card */}
              <div style={{
                background:C.white, borderRadius:"0 12px 12px 12px",
                padding:"24px", border:`1.5px solid ${C.grayLight}`,
                borderTop:"none",
              }}>
                {tabs.map(tab => (
                  <TabContent
                    key={tab.id}
                    tabId={tab.id}
                    isActive={activeTab===tab.id}
                    onFileLoaded={name => handleFileLoaded(tab.id, name)}
                    onDataModified={() => handleDataModified(tab.id)}
                    activeTool={activeTool}
                    onClearTool={() => setActiveTool(null)}
                    toolName={activeTool_?.name}
                    toolIcon={activeTool_?.icon}
                    toolDescription={activeTool_?.desc}
                    onDataSummaryChange={s => activeTab===tab.id && setDataSummary(s)}
                    onEditModeChange={m    => activeTab===tab.id && setEditMode(m)}
                    onHistoryChange={h     => activeTab===tab.id && setHistory(h)}
                    onDisplayDataChange={d => activeTab===tab.id && setDisplayData(d)}
                    onHiddenColumnsChange={c=>activeTab===tab.id && setHiddenCols(c)}
                    onToggleEditModeRegister={fn=>activeTab===tab.id && setEditToggler(()=>fn)}
                    onUndoRegister={fn => activeTab===tab.id && setUndoFn(()=>fn)}
                    onRedoRegister={fn => activeTab===tab.id && setRedoFn(()=>fn)}
                  />
                ))}
              </div>
            </div>

          </div>

        </>) : (

          /* ── ABOUT VIEW ─────────────────────────────────────────────────────── */
          <div style={{ maxWidth:800, margin:"0 auto", padding:"40px 32px 100px" }}>
            <div style={{ ...card(), padding:"36px 36px 32px", marginBottom:20 }}>
              <div style={{ ...flex("center","flex-start",12), marginBottom:20 }}>
                <div style={{
                  width:52, height:52, borderRadius:16, background:C.black,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <span style={{ fontSize:22, fontWeight:800, color:C.yellowMid }}>D</span>
                </div>
                <div>
                  <h1 style={{ fontSize:28, fontWeight:800, margin:0,
                    color:C.black, textAlign:"left" }}>DCP</h1>
                  <p style={{ margin:0, fontSize:14, color:C.yellowDeep, fontWeight:600 }}>
                    Data CSV Processor
                  </p>
                </div>
              </div>
              <p style={{ fontSize:15, color:C.grayDark, lineHeight:1.7, margin:0 }}>
                A fast, browser-based tool for loading, cleaning, reshaping, and exporting
                CSV data. Built for both mobile and desktop workflows.
              </p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {[
                { Icon:FileText,        name:"Multi-tab",    desc:"Work on several files simultaneously without losing context." },
                { Icon:Eraser,          name:"Clean",        desc:"Remove duplicates, blank rows, and messy data in one click." },
                { Icon:BarChart2,       name:"Statistics",   desc:"Sum, average, min and max for any numeric column instantly." },
                { Icon:TableProperties, name:"Pivot",        desc:"Drag and drop pivot tables without writing any formulas." },
                { Icon:LineChart,       name:"Charts",       desc:"Turn any column into a visual chart in seconds." },
                { Icon:Download,        name:"Export",       desc:"Download your cleaned, transformed data as a fresh CSV." },
              ].map(f => (
                <div key={f.name} style={{
                  ...card(), padding:"20px 22px",
                  display:"flex", gap:14, alignItems:"flex-start",
                }}>
                  <div style={{
                    width:40, height:40, borderRadius:10, background:C.yellow, flexShrink:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <f.Icon size={20} color={C.yellowDeep} />
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>{f.name}</div>
                    <div style={{ fontSize:13, color:C.grayMid, lineHeight:1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              ...card(), padding:"24px 28px", marginTop:20,
              background:C.black, border:"none",
            }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.yellowMid, marginBottom:8 }}>
                Built for every screen
              </div>
              <p style={{ fontSize:14, color:"#aaa", lineHeight:1.7, margin:0 }}>
                Designed mobile-first with a bottom navigation pattern and large tap targets,
                then extended to a full three-column desktop layout with a tool sidebar and
                live dataset panel — all without a page refresh.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── BOTTOM NAV (mobile only) ──────────────────────────────────────────── */}
      <nav className="mobile-only" style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:100,
        background:C.white, borderTop:`1px solid ${C.grayLight}`,
        display:"flex", justifyContent:"space-around",
        padding:"8px 0 22px",
      }}>
        {[
          { id:"home",  label:"Home",  Icon:Home    },
          { id:"tools", label:"Tools", Icon:Wrench  },
          { id:"files", label:"Files", Icon:FileText},
          { id:"about", label:"About", Icon:Info    },
        ].map(item => {
          const active = mobileTab===item.id;
          return (
            <button key={item.id}
              onClick={()=>{
                setMobileTab(item.id);
                if(item.id==="tools") { setSidebarOpen(true); }
                else { setCurrentView(item.id==="about"?"about":"home"); setSidebarOpen(false); }
              }}
              style={{
                display:"flex", flexDirection:"column", alignItems:"center",
                gap:3, cursor:"pointer", minWidth:60, border:"none", background:"none",
              }}
            >
              <item.Icon size={20} color={active ? C.black : C.grayMid} />
              <span style={{ fontSize:10, fontWeight:600,
                color: active ? C.black : C.grayMid }}>{item.label}</span>
              {active && <div style={{
                width:4, height:4, borderRadius:"50%",
                background:C.yellowDeep, marginTop:1,
              }}/>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}