import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdOutlineLocalHospital, MdOutlineAccountBalance, MdOutlineTraffic } from 'react-icons/md';
import { HiOutlineEye } from 'react-icons/hi';

import HospitalScenario from './visual-scenarios/HospitalScenario';
import BankScenario from './visual-scenarios/BankScenario';
import TrafficScenario from './visual-scenarios/TrafficScenario';

const SCENARIOS = [
  {
    id: 'hospital',
    label: 'Hospital Resources',
    icon: MdOutlineLocalHospital,
    emoji: '🏥',
    color: 'from-rose-500/20 to-pink-600/10 border-rose-500/30',
    accent: 'text-rose-400',
    description: 'Patients compete for Doctor, MRI Machine, ICU Bed, and Ventilator. See how circular resource requests lead to deadlock.',
    tags: ['Hold & Wait', 'Circular Wait', 'Mutual Exclusion'],
    difficulty: 'Beginner',
    component: HospitalScenario,
  },
  {
    id: 'bank',
    label: 'Bank Transactions',
    icon: MdOutlineAccountBalance,
    emoji: '🏦',
    color: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/30',
    accent: 'text-emerald-400',
    description: 'Two bank transactions lock different accounts and each waits for the account held by the other — a classic deadlock.',
    tags: ['Lock Ordering', 'Two-Phase Locking', 'Rollback'],
    difficulty: 'Intermediate',
    component: BankScenario,
  },
  {
    id: 'traffic',
    label: 'Traffic Intersection',
    icon: MdOutlineTraffic,
    emoji: '🚦',
    color: 'from-amber-500/20 to-orange-600/10 border-amber-500/30',
    accent: 'text-amber-400',
    description: 'Four cars arrive from four directions and each blocks the next in a circular chain. No car can advance!',
    tags: ['Circular Wait', 'No Preemption', 'Resource Ordering'],
    difficulty: 'Intermediate',
    component: TrafficScenario,
  },
];

const DIFF_COLOR = { Beginner: 'text-success bg-success/10 border-success/30', Intermediate: 'text-warning bg-warning/10 border-warning/30', Advanced: 'text-danger bg-danger/10 border-danger/30' };

export default function VisualMode() {
  const [activeId, setActiveId] = useState(null);
  const active = SCENARIOS.find(s => s.id === activeId);

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 glow-primary">
            <HiOutlineEye className="w-7 h-7 text-primary-light" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Visual Mode</h1>
            <p className="text-text-muted text-sm mt-0.5">Real-life deadlock scenarios through animation &amp; step-by-step simulation</p>
          </div>
        </div>
      </motion.div>

      {/* Scenario Cards Grid */}
      {!activeId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SCENARIOS.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => setActiveId(s.id)}
              className={`w-full text-left glass rounded-2xl p-6 border bg-gradient-to-br ${s.color} transition-all hover:shadow-lg group`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{s.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{s.label}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${DIFF_COLOR[s.difficulty]}`}>{s.difficulty}</span>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed mb-4">{s.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {s.tags.map(t => (
                      <span key={t} className="text-xs px-2 py-1 rounded-lg bg-surface-light/40 text-text-muted border border-border">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className={`mt-4 flex items-center gap-2 text-sm font-semibold ${s.accent} group-hover:gap-3 transition-all`}>
                <s.icon className="w-4 h-4" />
                Open Simulation →
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Active Scenario */}
      <AnimatePresence mode="wait">
        {activeId && active && (
          <motion.div key={activeId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {/* Back + title bar */}
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setActiveId(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-light/40 border border-border text-text-muted hover:text-white text-sm font-medium transition-all hover:bg-surface-light/60">
                ← Back to Scenarios
              </button>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{active.emoji}</span>
                <div>
                  <h2 className="text-xl font-bold text-white">{active.label}</h2>
                  <p className="text-xs text-text-muted">{active.description}</p>
                </div>
              </div>
            </div>

            {/* Scenario tabs (switch between scenarios while in active view) */}
            <div className="flex gap-1 p-1 bg-surface-light/30 rounded-xl border border-border mb-6 overflow-x-auto">
              {SCENARIOS.map(s => (
                <button key={s.id} onClick={() => setActiveId(s.id)}
                  className={`flex items-center gap-2 flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative ${activeId === s.id ? 'text-white' : 'text-text-muted hover:text-white'}`}>
                  {activeId === s.id && (
                    <motion.div layoutId="sceneTab"
                      className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/20 border border-primary/30 rounded-lg"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <s.icon className="w-4 h-4" />{s.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Render active scenario component */}
            <active.component />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick overview cards when no scenario selected */}
      {!activeId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.4 } }}>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-widest mb-4">What You'll Learn</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🔄', title: 'Circular Wait', desc: 'Visualize how processes form a cycle of resource dependencies.' },
              { icon: '📊', title: 'RAG Visualization', desc: 'Watch the Resource Allocation Graph build up in real time.' },
              { icon: '⚠️', title: 'Deadlock Detection', desc: 'See deadlock warnings animate the moment a cycle forms.' },
              { icon: '🛡️', title: 'Prevention Strategies', desc: 'Compare scenarios with and without deadlock prevention applied.' },
            ].map((c, i) => (
              <motion.div key={c.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
                className="glass-light rounded-2xl p-5 text-center">
                <div className="text-3xl mb-3">{c.icon}</div>
                <h4 className="font-semibold text-white text-sm mb-2">{c.title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
