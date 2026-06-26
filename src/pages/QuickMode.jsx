import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { bankersAlgorithm, calcNeed, calcAvailable } from '../utils/algorithms';
import { Card, Badge, Button, MatrixInput, SectionTitle, Tabs } from '../components/ui';
import {
  HiOutlinePlay, HiOutlineShieldCheck, HiOutlineXCircle, HiOutlineCheckCircle,
  HiOutlineRefresh, HiOutlineArrowRight, HiOutlineTrash,
} from 'react-icons/hi';
import { FaProjectDiagram } from 'react-icons/fa';
import { ReactFlow, Background, Controls, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const emptyMatrix = (r, c) => Array.from({ length: r }, () => Array(c).fill(''));

// ─── Tab 1: Banker's Algorithm ──────────────────────────────────────────────
function BankersTab() {
  const [p, setP] = useState(3);
  const [r, setR] = useState(3);
  const [avail, setAvail] = useState(['', '', '']);
  const [alloc, setAlloc] = useState(emptyMatrix(3, 3));
  const [max, setMax] = useState(emptyMatrix(3, 3));
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(-1);

  const updateDims = (np, nr) => {
    np = Math.max(1, Math.min(10, Number(np) || 1));
    nr = Math.max(1, Math.min(10, Number(nr) || 1));
    setP(np); setR(nr);
    setAvail(prev => { const a = Array(nr).fill(''); for (let i = 0; i < Math.min(prev.length, nr); i++) a[i] = prev[i]; return a; });
    setAlloc(prev => { const m = emptyMatrix(np, nr); for (let i = 0; i < Math.min(prev.length, np); i++) for (let j = 0; j < Math.min(prev[0]?.length||0, nr); j++) m[i][j] = prev[i]?.[j]??''; return m; });
    setMax(prev => { const m = emptyMatrix(np, nr); for (let i = 0; i < Math.min(prev.length, np); i++) for (let j = 0; j < Math.min(prev[0]?.length||0, nr); j++) m[i][j] = prev[i]?.[j]??''; return m; });
    setResult(null); setStep(-1);
  };

  const loadExample = () => {
    setP(5); setR(3);
    setAvail(['3','3','2']);
    setAlloc([['0','1','0'],['2','0','0'],['3','0','2'],['2','1','1'],['0','0','2']]);
    setMax([['7','5','3'],['3','2','2'],['9','0','2'],['2','2','2'],['4','3','3']]);
    setResult(null); setStep(-1);
    toast.success('Loaded Banker\'s example');
  };

  const run = useCallback(() => {
    try {
      const totalRes = avail.map(Number);
      for (let i = 0; i < p; i++) for (let j = 0; j < r; j++) totalRes[j] += Number(alloc[i][j]);
      const res = bankersAlgorithm(alloc, max, totalRes, p, r);
      setResult({ ...res, need: calcNeed(alloc.map(row=>row.map(Number)), max.map(row=>row.map(Number)), p, r) });
      setStep(-1);
      toast.success(res.isSafe ? '✅ Safe State Found' : '⚠️ Unsafe State');
    } catch (e) {
      toast.error('Invalid input: ' + e.message);
    }
  }, [p, r, avail, alloc, max]);

  return (
    <div className="space-y-6">
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white">Banker's Algorithm Configuration</h3>
          <Button variant="ghost" size="sm" onClick={loadExample}>Load Example</Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-muted mb-1">Processes</label>
            <input type="number" min="1" max="10" value={p} onChange={e => updateDims(e.target.value, r)}
              className="w-full h-10 px-4 bg-surface-light/40 border border-border rounded-xl text-text font-mono focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Resources</label>
            <input type="number" min="1" max="10" value={r} onChange={e => updateDims(p, e.target.value)}
              className="w-full h-10 px-4 bg-surface-light/40 border border-border rounded-xl text-text font-mono focus:border-primary outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-2">Available Resources</label>
          <div className="flex flex-wrap gap-2">
            {avail.map((v, j) => (
              <div key={j} className="flex flex-col items-center gap-1">
                <span className="text-xs text-primary-light font-mono">R{j}</span>
                <input type="number" min="0" value={v}
                  onChange={e => { const a=[...avail]; a[j]=e.target.value; setAvail(a); }}
                  className="w-16 h-9 text-center text-sm font-mono bg-surface-light/40 border border-border rounded-lg text-text focus:border-primary outline-none" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MatrixInput label="Allocation Matrix" rows={p} cols={r} value={alloc} onChange={setAlloc} />
          <MatrixInput label="Maximum Matrix" rows={p} cols={r} value={max} onChange={setMax} />
        </div>
        <div className="flex gap-3">
          <Button onClick={run} size="lg"><HiOutlinePlay className="w-5 h-5" /> Run Banker's Algorithm</Button>
          <Button variant="secondary" size="lg" onClick={() => { setResult(null); setStep(-1); setAvail(Array(r).fill('')); setAlloc(emptyMatrix(p,r)); setMax(emptyMatrix(p,r)); }}>
            <HiOutlineRefresh className="w-5 h-5" /> Reset
          </Button>
        </div>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* State Badge */}
            <Card className={`text-center py-6 ${result.isSafe ? 'glow-success' : 'glow-danger'}`}>
              {result.isSafe ? <HiOutlineShieldCheck className="w-14 h-14 mx-auto text-success mb-3" /> : <HiOutlineXCircle className="w-14 h-14 mx-auto text-danger mb-3" />}
              <Badge color={result.isSafe ? 'success' : 'danger'} size="lg" pulse>{result.isSafe ? 'SAFE STATE' : 'UNSAFE STATE'}</Badge>
              {result.isSafe && (
                <div className="flex items-center justify-center gap-2 flex-wrap mt-4">
                  <span className="text-sm text-text-muted">Safe Sequence:</span>
                  {result.safeSequence.map((sp, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <Badge color="success">P{sp}</Badge>
                      {i < result.safeSequence.length - 1 && <HiOutlineArrowRight className="w-3 h-3 text-success/60" />}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Need Matrix */}
            <Card>
              <h4 className="text-sm font-bold text-white mb-3">Need Matrix (Max - Alloc)</h4>
              <div className="overflow-x-auto">
                <table className="text-sm">
                  <thead>
                    <tr><th className="px-3 py-2 text-text-muted"></th>
                      {Array.from({length: r}, (_,j) => <th key={j} className="px-3 py-2 text-primary-light font-mono">R{j}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {result.need.map((row, i) => (
                      <tr key={i} className="border-t border-border/30">
                        <td className="px-3 py-2 text-accent font-mono font-semibold">P{i}</td>
                        {row.map((v, j) => <td key={j} className="px-3 py-2 font-mono text-center">{v}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Step-by-step */}
            {result.isSafe && result.steps.length > 0 && (
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Step-by-Step Execution</h4>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setStep(s => Math.max(-1, s - 1))}>← Prev</Button>
                    <Button variant="ghost" size="sm" onClick={() => setStep(s => Math.min(result.steps.length - 1, s + 1))}>Next →</Button>
                    <Button variant="ghost" size="sm" onClick={() => setStep(result.steps.length - 1)}>All</Button>
                  </div>
                </div>
                {result.steps.slice(0, step + 1).map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-xl bg-success/5 border border-success/20">
                    <p className="text-sm font-semibold text-success mb-1">Step {i + 1}: P{s.process} can execute</p>
                    <p className="text-xs text-text-muted">
                      Need [{s.need.join(', ')}] ≤ Work [{s.workBefore.join(', ')}] ✓
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      P{s.process} releases resources → Work becomes [{s.workAfter.join(', ')}]
                    </p>
                  </motion.div>
                ))}
                {step === -1 && <p className="text-sm text-text-muted text-center py-4">Click "Next" to step through execution.</p>}
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab 2: Detection + Recovery ────────────────────────────────────────────
function DetectionTab() {
  const [p, setP] = useState(3);
  const [r, setR] = useState(2);
  const [allocData, setAllocData] = useState(emptyMatrix(3, 2));
  const [requestData, setRequestData] = useState(emptyMatrix(3, 2));
  const [totalRes, setTotalRes] = useState(['', '']);
  const [result, setResult] = useState(null);
  const [recovered, setRecovered] = useState(null);

  const updateDims = (np, nr) => {
    np = Math.max(1, Math.min(10, Number(np)||1));
    nr = Math.max(1, Math.min(10, Number(nr)||1));
    setP(np); setR(nr);
    setTotalRes(prev => { const a = Array(nr).fill(''); for (let i = 0; i < Math.min(prev.length, nr); i++) a[i] = prev[i]; return a; });
    setAllocData(prev => { const m = emptyMatrix(np,nr); for(let i=0;i<Math.min(prev.length,np);i++) for(let j=0;j<Math.min(prev[0]?.length||0,nr);j++) m[i][j]=prev[i]?.[j]??''; return m; });
    setRequestData(prev => { const m = emptyMatrix(np,nr); for(let i=0;i<Math.min(prev.length,np);i++) for(let j=0;j<Math.min(prev[0]?.length||0,nr);j++) m[i][j]=prev[i]?.[j]??''; return m; });
    setResult(null); setRecovered(null);
  };

  const loadExample = () => {
    setP(3); setR(2);
    setTotalRes(['4','4']);
    setAllocData([['1','1'],['1','1'],['1','1']]);
    setRequestData([['1','0'],['0','1'],['1','1']]);
    setResult(null); setRecovered(null);
    toast.success('Loaded detection example');
  };

  const detect = () => {
    try {
      const total = totalRes.map(Number);
      const alloc = allocData.map(row => row.map(Number));
      const req = requestData.map(row => row.map(Number));
      const avail = total.map((t, j) => { let s = 0; for (let i = 0; i < p; i++) s += alloc[i][j]; return t - s; });

      // Build RAG nodes/edges
      const nodes = [];
      const edges = [];
      for (let i = 0; i < p; i++) {
        nodes.push({
          id: `p${i}`, data: { label: `P${i}` },
          position: { x: 80, y: 60 + i * 120 },
          style: { background: 'rgba(99,102,241,0.3)', border: '2px solid #6366f1', borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0', fontWeight: 700 },
        });
      }
      for (let j = 0; j < r; j++) {
        nodes.push({
          id: `r${j}`, data: { label: `R${j} [${total[j]}]` },
          position: { x: 350, y: 60 + j * 140 },
          style: { background: 'rgba(14,165,233,0.3)', border: '2px solid #0ea5e9', borderRadius: '8px', padding: '10px 16px', color: '#e2e8f0', fontWeight: 600 },
        });
      }
      for (let i = 0; i < p; i++) {
        for (let j = 0; j < r; j++) {
          if (alloc[i][j] > 0) edges.push({ id: `a${i}${j}`, source: `r${j}`, target: `p${i}`, style: { stroke: '#10b981' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }, label: `${alloc[i][j]}`, labelStyle: { fill: '#94a3b8', fontSize: 10 }, labelBgStyle: { fill: '#1e1b4b', fillOpacity: 0.8 } });
          if (req[i][j] > 0) edges.push({ id: `q${i}${j}`, source: `p${i}`, target: `r${j}`, style: { stroke: '#f59e0b', strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' }, label: `${req[i][j]}`, labelStyle: { fill: '#94a3b8', fontSize: 10 }, labelBgStyle: { fill: '#1e1b4b', fillOpacity: 0.8 } });
        }
      }

      // Detect deadlock: try to find processes that can complete
      const work = [...avail];
      const finish = Array(p).fill(false);
      let found = true;
      while (found) {
        found = false;
        for (let i = 0; i < p; i++) {
          if (!finish[i] && req[i].every((v, j) => v <= work[j])) {
            for (let j = 0; j < r; j++) work[j] += alloc[i][j];
            finish[i] = true; found = true;
          }
        }
      }
      const deadlocked = finish.map((f, i) => (!f ? i : -1)).filter(i => i !== -1);

      // Highlight deadlocked nodes
      deadlocked.forEach(i => {
        const node = nodes.find(n => n.id === `p${i}`);
        if (node) { node.style.background = 'rgba(239,68,68,0.3)'; node.style.border = '2px solid #ef4444'; }
      });

      setResult({ deadlocked, nodes, edges, alloc, req, avail, total, finish });
      setRecovered(null);
      toast.success(deadlocked.length > 0 ? '🔴 Deadlock Detected' : '✅ No Deadlock');
    } catch (e) { toast.error('Invalid input: ' + e.message); }
  };

  const recoverTerminate = (pid) => {
    if (!result) return;
    const newAlloc = result.alloc.map(row => [...row]);
    const released = [...newAlloc[pid]];
    newAlloc[pid] = Array(r).fill(0);
    const newAvail = result.avail.map((v, j) => v + released[j]);
    setRecovered({ method: 'terminate', process: pid, released, newAvail, message: `P${pid} terminated. Resources released: [${released.join(', ')}]. Remaining processes can continue.` });
    toast.success(`P${pid} terminated for recovery`);
  };

  const recoverRelease = (pid) => {
    if (!result) return;
    const released = [...result.alloc[pid]];
    const newAvail = result.avail.map((v, j) => v + released[j]);
    setRecovered({ method: 'release', process: pid, released, newAvail, message: `Resources of P${pid} released: [${released.join(', ')}]. Available now: [${newAvail.join(', ')}]. Deadlock removed.` });
    toast.success(`Resources of P${pid} released`);
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white">RAG Detection & Recovery</h3>
          <Button variant="ghost" size="sm" onClick={loadExample}>Load Example</Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-muted mb-1">Processes</label>
            <input type="number" min="1" max="10" value={p} onChange={e => updateDims(e.target.value, r)}
              className="w-full h-10 px-4 bg-surface-light/40 border border-border rounded-xl text-text font-mono focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Resources</label>
            <input type="number" min="1" max="10" value={r} onChange={e => updateDims(p, e.target.value)}
              className="w-full h-10 px-4 bg-surface-light/40 border border-border rounded-xl text-text font-mono focus:border-primary outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-2">Total Resources</label>
          <div className="flex flex-wrap gap-2">
            {totalRes.map((v, j) => (
              <div key={j} className="flex flex-col items-center gap-1">
                <span className="text-xs text-primary-light font-mono">R{j}</span>
                <input type="number" min="0" value={v} onChange={e => { const a=[...totalRes]; a[j]=e.target.value; setTotalRes(a); }}
                  className="w-16 h-9 text-center text-sm font-mono bg-surface-light/40 border border-border rounded-lg text-text focus:border-primary outline-none" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MatrixInput label="Current Allocation" rows={p} cols={r} value={allocData} onChange={setAllocData} />
          <MatrixInput label="Current Requests" rows={p} cols={r} value={requestData} onChange={setRequestData} />
        </div>
        <div className="flex gap-3">
          <Button onClick={detect} size="lg"><FaProjectDiagram className="w-4 h-4" /> Detect Deadlock</Button>
          <Button variant="secondary" size="lg" onClick={() => { setResult(null); setRecovered(null); }}><HiOutlineRefresh className="w-5 h-5" /> Reset</Button>
        </div>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className={`text-center py-6 ${result.deadlocked.length > 0 ? 'glow-danger' : 'glow-success'}`}>
              <Badge color={result.deadlocked.length > 0 ? 'danger' : 'success'} size="lg" pulse>
                {result.deadlocked.length > 0 ? 'DEADLOCK DETECTED' : 'NO DEADLOCK'}
              </Badge>
              {result.deadlocked.length > 0 && (
                <p className="text-sm text-text-muted mt-3">Deadlocked processes: {result.deadlocked.map(i => `P${i}`).join(', ')}</p>
              )}
            </Card>

            {/* RAG Graph */}
            <Card>
              <h4 className="text-sm font-bold text-white mb-3">Resource Allocation Graph</h4>
              <div className="flex gap-4 mb-3 text-xs text-text-muted">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-success inline-block"></span> Allocation</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-warning inline-block border-dashed"></span> Request</span>
              </div>
              <div className="h-80 rounded-xl overflow-hidden border border-border bg-bg-light/50">
                <ReactFlow nodes={result.nodes} edges={result.edges} fitView>
                  <Background color="rgba(99,102,241,0.05)" gap={20} />
                  <Controls />
                </ReactFlow>
              </div>
            </Card>

            {/* Recovery */}
            {result.deadlocked.length > 0 && (
              <Card className="space-y-4">
                <h4 className="text-sm font-bold text-white">Recovery Options</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.deadlocked.map(pid => (
                    <div key={pid} className="p-4 rounded-xl bg-surface-light/30 border border-border space-y-3">
                      <p className="text-sm font-semibold text-white">P{pid}</p>
                      <div className="flex gap-2">
                        <Button variant="danger" size="sm" onClick={() => recoverTerminate(pid)}>
                          <HiOutlineTrash className="w-4 h-4" /> Terminate
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => recoverRelease(pid)}>
                          <HiOutlineRefresh className="w-4 h-4" /> Release Resources
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <AnimatePresence>
                  {recovered && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-success/10 border border-success/20">
                      <HiOutlineCheckCircle className="w-6 h-6 text-success mb-2" />
                      <p className="text-sm text-success">{recovered.message}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Quick Mode Page ────────────────────────────────────────────────────────
export default function QuickMode() {
  const [activeTab, setActiveTab] = useState('bankers');
  const tabs = [
    { id: 'bankers', label: 'Deadlock Avoidance', icon: HiOutlineShieldCheck },
    { id: 'detection', label: 'Detection + Recovery', icon: FaProjectDiagram },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SectionTitle icon={HiOutlinePlay} title="Quick Mode" subtitle="Directly execute deadlock algorithms without smart analysis" />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {activeTab === 'bankers' ? <BankersTab /> : <DetectionTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
