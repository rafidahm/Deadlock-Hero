import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { runSmartAnalysis } from '../utils/algorithms';
import { Card, Badge, Button, MatrixInput, SectionTitle, ProgressBar, Tooltip } from '../components/ui';
import {
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineBan,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import { FaLock, FaHandPaper, FaBan, FaSyncAlt, FaProjectDiagram } from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as RTooltip,
} from 'recharts';
import {
  ReactFlow, Background, Controls, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ─── Helper: create empty matrix ────────────────────────────────────────────
const emptyMatrix = (r, c) => Array.from({ length: r }, () => Array(c).fill(''));

export default function SmartMode() {
  const { addAnalysis } = useApp();
  const [processes, setProcesses] = useState(3);
  const [resources, setResources] = useState(3);
  const [totalResources, setTotalResources] = useState(['', '', '']);
  const [allocation, setAllocation] = useState(emptyMatrix(3, 3));
  const [maximum, setMaximum] = useState(emptyMatrix(3, 3));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  // Update dimensions
  const updateDimensions = (p, r) => {
    const np = Math.max(1, Math.min(20, Number(p) || 1));
    const nr = Math.max(1, Math.min(20, Number(r) || 1));
    setProcesses(np);
    setResources(nr);
    setTotalResources(prev => {
      const arr = Array(nr).fill('');
      for (let i = 0; i < Math.min(prev.length, nr); i++) arr[i] = prev[i];
      return arr;
    });
    setAllocation(prev => {
      const m = emptyMatrix(np, nr);
      for (let i = 0; i < Math.min(prev.length, np); i++)
        for (let j = 0; j < Math.min(prev[0]?.length || 0, nr); j++) m[i][j] = prev[i][j] ?? '';
      return m;
    });
    setMaximum(prev => {
      const m = emptyMatrix(np, nr);
      for (let i = 0; i < Math.min(prev.length, np); i++)
        for (let j = 0; j < Math.min(prev[0]?.length || 0, nr); j++) m[i][j] = prev[i][j] ?? '';
      return m;
    });
  };

  // Load example
  const loadExample = (type) => {
    if (type === 'safe') {
      setProcesses(3); setResources(3);
      setTotalResources(['10', '5', '7']);
      setAllocation([['0','1','0'],['2','0','0'],['3','0','2']]);
      setMaximum([['7','5','3'],['3','2','2'],['9','0','2']]);
    } else if (type === 'unsafe') {
      setProcesses(3); setResources(3);
      setTotalResources(['6', '5', '4']);
      setAllocation([['2','2','1'],['2','1','1'],['1','1','1']]);
      setMaximum([['5','4','3'],['4','3','3'],['3','3','2']]);
    } else {
      setProcesses(3); setResources(3);
      setTotalResources(['3', '3', '2']);
      setAllocation([['1','1','0'],['1','0','1'],['0','1','1']]);
      setMaximum([['2','2','1'],['2','1','2'],['1','2','2']]);
    }
    setResult(null);
    setErrors([]);
    toast.success(`Loaded ${type} example`);
  };

  // Run analysis
  const analyze = useCallback(() => {
    setLoading(true);
    setErrors([]);
    setResult(null);

    setTimeout(() => {
      const res = runSmartAnalysis({ processes, resources, totalResources, allocation, maximum });
      if (!res.valid) {
        setErrors(res.errors);
        toast.error('Validation failed. Please fix errors.');
      } else {
        setResult(res);
        addAnalysis({
          systemState: res.systemState,
          timestamp: res.timestamp,
          processes,
          resources,
        });
        const stateMsg = { SAFE: '✅ Safe State', UNSAFE: '⚠️ Unsafe State', DEADLOCKED: '🔴 Deadlocked' };
        toast.success(stateMsg[res.systemState] || 'Analysis complete');
      }
      setLoading(false);
    }, 800);
  }, [processes, resources, totalResources, allocation, maximum, addAnalysis]);

  const reset = () => {
    setResult(null);
    setErrors([]);
    setTotalResources(Array(resources).fill(''));
    setAllocation(emptyMatrix(processes, resources));
    setMaximum(emptyMatrix(processes, resources));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SectionTitle
        icon={HiOutlineLightningBolt}
        title="Smart Mode"
        subtitle="Intelligent system analysis with automatic deadlock detection and recommendations"
      />

      {/* Input Section */}
      <Card className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white">System Configuration</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => loadExample('safe')}>Load Safe Example</Button>
            <Button variant="ghost" size="sm" onClick={() => loadExample('unsafe')}>Load Unsafe Example</Button>
            <Button variant="ghost" size="sm" onClick={() => loadExample('deadlock')}>Load Deadlock Example</Button>
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Number of Processes</label>
            <input
              type="number" min="1" max="20" value={processes}
              onChange={e => updateDimensions(e.target.value, resources)}
              className="w-full h-10 px-4 bg-surface-light/40 border border-border rounded-xl text-text font-mono focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Number of Resource Types</label>
            <input
              type="number" min="1" max="20" value={resources}
              onChange={e => updateDimensions(processes, e.target.value)}
              className="w-full h-10 px-4 bg-surface-light/40 border border-border rounded-xl text-text font-mono focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
            />
          </div>
        </div>

        {/* Total Resources */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Total Resources</label>
          <div className="flex flex-wrap gap-2">
            {totalResources.map((v, j) => (
              <div key={j} className="flex flex-col items-center gap-1">
                <span className="text-xs text-primary-light font-mono">R{j}</span>
                <input
                  type="number" min="0" value={v}
                  onChange={e => {
                    const arr = [...totalResources];
                    arr[j] = e.target.value;
                    setTotalResources(arr);
                  }}
                  className="w-16 h-9 text-center text-sm font-mono bg-surface-light/40 border border-border rounded-lg text-text focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Matrices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MatrixInput label="Allocation Matrix" rows={processes} cols={resources} value={allocation} onChange={setAllocation} />
          <MatrixInput label="Maximum Matrix" rows={processes} cols={resources} value={maximum} onChange={setMaximum} />
        </div>

        {/* Errors */}
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-danger/10 border border-danger/20 space-y-1"
            >
              <p className="text-sm font-semibold text-danger flex items-center gap-2">
                <HiOutlineXCircle className="w-4 h-4" /> Validation Errors
              </p>
              {errors.map((err, i) => (
                <p key={i} className="text-xs text-danger/80 ml-6">• {err}</p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={analyze} loading={loading} size="lg">
            <HiOutlineLightningBolt className="w-5 h-5" />
            Analyze System
          </Button>
          <Button variant="secondary" onClick={reset} size="lg">
            <HiOutlineRefresh className="w-5 h-5" />
            Reset
          </Button>
        </div>
      </Card>

      {/* ─── Results ───────────────────────────────────────────── */}
      <AnimatePresence>
        {result && <SmartResults result={result} processes={processes} resources={resources} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Results Component ──────────────────────────────────────────────────────
function SmartResults({ result, processes, resources }) {
  const stateConfig = {
    SAFE: { color: 'success', icon: HiOutlineShieldCheck, label: 'SAFE', glow: 'glow-success' },
    UNSAFE: { color: 'warning', icon: HiOutlineExclamation, label: 'UNSAFE', glow: 'glow-warning' },
    DEADLOCKED: { color: 'danger', icon: HiOutlineBan, label: 'DEADLOCKED', glow: 'glow-danger' },
  };
  const sc = stateConfig[result.systemState];

  // Build React Flow nodes/edges for dependency graph
  const flowNodes = [];
  const flowEdges = [];
  const cycleProcesses = new Set();
  if (result.circularDep.cycles) {
    result.circularDep.cycles.forEach(cycle => cycle.forEach(p => cycleProcesses.add(p)));
  }
  for (let i = 0; i < processes; i++) {
    flowNodes.push({
      id: `p${i}`,
      data: { label: `P${i}` },
      position: { x: 150 + 200 * Math.cos((2 * Math.PI * i) / processes), y: 150 + 150 * Math.sin((2 * Math.PI * i) / processes) },
      style: {
        background: cycleProcesses.has(i) ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.3)',
        border: cycleProcesses.has(i) ? '2px solid #ef4444' : '2px solid #6366f1',
        borderRadius: '12px',
        padding: '10px 20px',
        color: '#e2e8f0',
        fontWeight: 600,
        fontSize: '14px',
      },
    });
  }
  // Add edges from waiting dependencies
  const addedEdges = new Set();
  result.waiting.dependencies.forEach(dep => {
    const from = dep.waiting.replace('P', '');
    const to = dep.waitingFor.replace('P', '');
    const edgeId = `${from}-${to}`;
    if (!addedEdges.has(edgeId)) {
      addedEdges.add(edgeId);
      const inCycle = cycleProcesses.has(Number(from)) && cycleProcesses.has(Number(to));
      flowEdges.push({
        id: edgeId,
        source: `p${from}`,
        target: `p${to}`,
        animated: inCycle,
        style: { stroke: inCycle ? '#ef4444' : '#6366f1', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: inCycle ? '#ef4444' : '#6366f1' },
        label: dep.resource,
        labelStyle: { fill: '#94a3b8', fontSize: 11 },
        labelBgStyle: { fill: '#1e1b4b', fillOpacity: 0.8 },
      });
    }
  });

  const conditionItems = [
    { key: 'mutualExclusion', icon: FaLock, label: 'Mutual Exclusion', present: result.conditions.mutualExclusion },
    { key: 'holdAndWait', icon: FaHandPaper, label: 'Hold and Wait', present: result.conditions.holdAndWait },
    { key: 'noPreemption', icon: FaBan, label: 'No Preemption', present: result.conditions.noPreemption },
    { key: 'circularWait', icon: FaSyncAlt, label: 'Circular Wait', present: result.conditions.circularWait },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* System State Banner */}
      <Card className={`${sc.glow} text-center py-8`}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          <sc.icon className={`w-16 h-16 mx-auto text-${sc.color} mb-4`} />
        </motion.div>
        <Badge color={sc.color} size="lg" pulse>{sc.label}</Badge>
        <p className="text-text-muted mt-3 text-sm max-w-md mx-auto">
          {result.systemState === 'SAFE' && 'All processes can complete successfully. The system is in a safe state.'}
          {result.systemState === 'UNSAFE' && 'The system may enter deadlock with future requests. Caution is advised.'}
          {result.systemState === 'DEADLOCKED' && 'Processes cannot proceed due to circular dependency. Immediate action required.'}
        </p>
      </Card>

      {/* Deadlock Conditions */}
      <div>
        <SectionTitle icon={HiOutlineInformationCircle} title="Deadlock Condition Check" subtitle="Status of all four necessary conditions" delay={0.1} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {conditionItems.map((c, i) => (
            <Card key={c.key} delay={0.2 + i * 0.1}
              className={`text-center ${c.present ? 'bg-gradient-to-br from-danger/15 to-danger/5 border border-danger/20' : 'bg-gradient-to-br from-success/15 to-success/5 border border-success/20'}`}
            >
              <c.icon className={`w-8 h-8 mx-auto mb-2 ${c.present ? 'text-danger' : 'text-success'}`} />
              <p className="text-sm font-semibold text-white mb-1">{c.label}</p>
              <Badge color={c.present ? 'danger' : 'success'} size="sm">
                {c.present ? 'Present' : 'Not Present'}
              </Badge>
            </Card>
          ))}
        </div>
      </div>

      {/* Resource Utilization */}
      <div>
        <SectionTitle icon={HiOutlineChartBar} title="Resource Utilization Analysis" subtitle="How resources are being used across processes" delay={0.2} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card delay={0.3}>
            <div className="space-y-4">
              {result.utilization.map((u, i) => (
                <div key={i}>
                  <ProgressBar
                    value={u.percentage}
                    label={`${u.resource} — ${u.allocated}/${u.total} allocated`}
                    color={u.percentage >= 90 ? 'danger' : u.percentage >= 70 ? 'warning' : 'primary'}
                  />
                </div>
              ))}
            </div>
          </Card>
          <Card delay={0.4}>
            <p className="text-sm font-semibold text-text-muted mb-3">Resource Usage Chart</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.utilization}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                  <XAxis dataKey="resource" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} unit="%" />
                  <RTooltip
                    contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', color: '#e2e8f0' }}
                    formatter={(v) => [`${v}%`, 'Usage']}
                  />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                    {result.utilization.map((u, i) => (
                      <Cell key={i} fill={u.percentage >= 90 ? '#ef4444' : u.percentage >= 70 ? '#f59e0b' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Waiting Dependencies */}
      <div>
        <SectionTitle icon={HiOutlineClock} title="Waiting Dependency Analysis" subtitle={`${result.waiting.waitingCount} process(es) currently waiting`} delay={0.3} />
        <Card delay={0.4}>
          {result.waiting.dependencies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Waiting Process</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Waiting For</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Resource</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Needed</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Held by Target</th>
                  </tr>
                </thead>
                <tbody>
                  {result.waiting.dependencies.map((d, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-accent">{d.waiting}</td>
                      <td className="py-3 px-4 font-mono text-primary-light">{d.waitingFor}</td>
                      <td className="py-3 px-4 font-mono">{d.resource}</td>
                      <td className="py-3 px-4 font-mono">{d.needed}</td>
                      <td className="py-3 px-4 font-mono">{d.held}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-text-muted py-6">No waiting dependencies detected.</p>
          )}
        </Card>
      </div>

      {/* Circular Dependency Graph */}
      <div>
        <SectionTitle icon={FaProjectDiagram} title="Circular Dependency Detection" delay={0.4} />
        <Card delay={0.5} className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-text-muted">Cycle Found:</span>
            <Badge color={result.circularDep.hasCycle ? 'danger' : 'success'} pulse={result.circularDep.hasCycle}>
              {result.circularDep.hasCycle ? 'YES' : 'NO'}
            </Badge>
          </div>
          {result.circularDep.hasCycle && result.circularDep.cycles.length > 0 && (
            <div className="space-y-1">
              {result.circularDep.cycles.map((cycle, i) => (
                <p key={i} className="text-sm text-danger font-mono flex items-center gap-1 flex-wrap">
                  {cycle.map((p, j) => (
                    <span key={j} className="flex items-center gap-1">
                      <Badge color="danger" size="sm">P{p}</Badge>
                      {j < cycle.length - 1 && <HiOutlineArrowRight className="w-3 h-3 text-danger/60" />}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          )}
          {flowNodes.length > 0 && flowEdges.length > 0 && (
            <div className="h-80 rounded-xl overflow-hidden border border-border bg-bg-light/50 mt-3">
              <ReactFlow nodes={flowNodes} edges={flowEdges} fitView className="bg-transparent">
                <Background color="rgba(99,102,241,0.05)" gap={20} />
                <Controls />
              </ReactFlow>
            </div>
          )}
          {flowEdges.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">No dependency edges to visualize.</p>
          )}
        </Card>
      </div>

      {/* Safe Sequence */}
      <div>
        <SectionTitle icon={HiOutlineShieldCheck} title="Safe Sequence Check" delay={0.5} />
        <Card delay={0.6} className="text-center py-6">
          {result.bankers.isSafe ? (
            <>
              <HiOutlineCheckCircle className="w-12 h-12 mx-auto text-success mb-3" />
              <p className="text-sm text-text-muted mb-3">Safe Sequence Found</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {result.bankers.safeSequence.map((p, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <Badge color="success" size="md">P{p}</Badge>
                    {i < result.bankers.safeSequence.length - 1 && (
                      <HiOutlineArrowRight className="w-4 h-4 text-success/60" />
                    )}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <HiOutlineXCircle className="w-12 h-12 mx-auto text-danger mb-3" />
              <p className="text-sm text-text-muted">No Safe Sequence Found</p>
            </>
          )}
        </Card>
      </div>

      {/* Recommendation */}
      <div>
        <SectionTitle icon={HiOutlineLightningBolt} title="Recommendation" delay={0.6} />
        <Card delay={0.7} className={`${sc.glow} border border-${sc.color}/30`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl bg-${sc.color}/20 flex-shrink-0`}>
              <sc.icon className={`w-8 h-8 text-${sc.color}`} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white mb-1">{result.recommendation.action}</h4>
              <p className="text-sm text-text-muted mb-2">{result.recommendation.detail}</p>
              {result.recommendation.mode && (
                <Badge color={sc.color} size="sm">Go to → {result.recommendation.mode}</Badge>
              )}
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
