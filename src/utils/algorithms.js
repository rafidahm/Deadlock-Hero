// ─── Input Validation ───────────────────────────────────────────────────────
export function validateInputs({ processes, resources, totalResources, allocation, maximum }) {
  const errors = [];

  if (!processes || processes < 1 || processes > 20)
    errors.push('Number of processes must be between 1 and 20.');
  if (!resources || resources < 1 || resources > 20)
    errors.push('Number of resource types must be between 1 and 20.');

  if (totalResources) {
    if (totalResources.length !== resources)
      errors.push(`Total Resources must have exactly ${resources} values.`);
    for (let j = 0; j < totalResources.length; j++) {
      if (totalResources[j] === '' || totalResources[j] === null || totalResources[j] === undefined)
        errors.push(`Total Resource R${j} is empty.`);
      else if (isNaN(totalResources[j]) || Number(totalResources[j]) < 0)
        errors.push(`Total Resource R${j} must be a non-negative number.`);
    }
  } else {
    errors.push('Total Resources are required.');
  }

  const validateMatrix = (matrix, name) => {
    if (!matrix) { errors.push(`${name} is required.`); return; }
    if (matrix.length !== processes)
      errors.push(`${name} must have exactly ${processes} rows.`);
    for (let i = 0; i < matrix.length; i++) {
      if (!matrix[i] || matrix[i].length !== resources)
        errors.push(`${name} row ${i} must have exactly ${resources} columns.`);
      else {
        for (let j = 0; j < matrix[i].length; j++) {
          const v = matrix[i][j];
          if (v === '' || v === null || v === undefined)
            errors.push(`${name}[P${i}][R${j}] is empty.`);
          else if (isNaN(v) || Number(v) < 0)
            errors.push(`${name}[P${i}][R${j}] must be a non-negative number.`);
        }
      }
    }
  };

  validateMatrix(allocation, 'Allocation Matrix');
  validateMatrix(maximum, 'Maximum Matrix');

  // Check allocation doesn't exceed total
  if (errors.length === 0 && allocation && totalResources) {
    for (let j = 0; j < resources; j++) {
      let totalAlloc = 0;
      for (let i = 0; i < processes; i++) totalAlloc += Number(allocation[i][j]);
      if (totalAlloc > Number(totalResources[j]))
        errors.push(`Total allocation for R${j} (${totalAlloc}) exceeds total available (${totalResources[j]}).`);
    }
  }

  // Check maximum >= allocation
  if (errors.length === 0 && allocation && maximum) {
    for (let i = 0; i < processes; i++) {
      for (let j = 0; j < resources; j++) {
        if (Number(maximum[i][j]) < Number(allocation[i][j]))
          errors.push(`Maximum[P${i}][R${j}] (${maximum[i][j]}) is less than Allocation[P${i}][R${j}] (${allocation[i][j]}).`);
      }
    }
  }

  return errors;
}

// ─── Calculate Available Resources ──────────────────────────────────────────
export function calcAvailable(totalResources, allocation, processes, resources) {
  const total = totalResources.map(Number);
  const avail = [...total];
  for (let i = 0; i < processes; i++) {
    for (let j = 0; j < resources; j++) {
      avail[j] -= Number(allocation[i][j]);
    }
  }
  return avail;
}

// ─── Calculate Need Matrix ──────────────────────────────────────────────────
export function calcNeed(allocation, maximum, processes, resources) {
  const need = [];
  for (let i = 0; i < processes; i++) {
    need[i] = [];
    for (let j = 0; j < resources; j++) {
      need[i][j] = Number(maximum[i][j]) - Number(allocation[i][j]);
    }
  }
  return need;
}

// ─── Banker's Algorithm ─────────────────────────────────────────────────────
export function bankersAlgorithm(allocation, maximum, totalResources, processes, resources) {
  const alloc = allocation.map(r => r.map(Number));
  const max = maximum.map(r => r.map(Number));
  const total = totalResources.map(Number);
  const need = calcNeed(alloc, max, processes, resources);
  const avail = calcAvailable(total, alloc, processes, resources);

  const work = [...avail];
  const finish = new Array(processes).fill(false);
  const safeSequence = [];
  const steps = [];

  let found = true;
  while (found) {
    found = false;
    for (let i = 0; i < processes; i++) {
      if (!finish[i]) {
        let canRun = true;
        for (let j = 0; j < resources; j++) {
          if (need[i][j] > work[j]) { canRun = false; break; }
        }
        if (canRun) {
          steps.push({
            process: i,
            workBefore: [...work],
            need: [...need[i]],
            allocation: [...alloc[i]],
          });
          for (let j = 0; j < resources; j++) work[j] += alloc[i][j];
          steps[steps.length - 1].workAfter = [...work];
          finish[i] = true;
          safeSequence.push(i);
          found = true;
        }
      }
    }
  }

  const isSafe = finish.every(f => f);
  return { isSafe, safeSequence, steps, need, available: avail };
}

// ─── Deadlock Condition Check ───────────────────────────────────────────────
export function checkDeadlockConditions(allocation, maximum, totalResources, processes, resources) {
  const alloc = allocation.map(r => r.map(Number));
  const max = maximum.map(r => r.map(Number));
  const total = totalResources.map(Number);
  const need = calcNeed(alloc, max, processes, resources);
  const avail = calcAvailable(total, alloc, processes, resources);

  // Mutual Exclusion: resources are allocated (any resource has allocation > 0)
  let mutualExclusion = false;
  for (let j = 0; j < resources; j++) {
    let allocCount = 0;
    for (let i = 0; i < processes; i++) {
      if (alloc[i][j] > 0) allocCount++;
    }
    if (allocCount >= 1 && total[j] > 0) { mutualExclusion = true; break; }
  }

  // Hold and Wait: a process holds resources and needs more
  let holdAndWait = false;
  for (let i = 0; i < processes; i++) {
    const holdsAny = alloc[i].some(v => v > 0);
    const needsMore = need[i].some(v => v > 0);
    if (holdsAny && needsMore) { holdAndWait = true; break; }
  }

  // No Preemption: always true in this model (resources can't be forcibly taken)
  const noPreemption = true;

  // Circular Wait: detected by checking for cycles in wait-for graph
  const { hasCycle, cycles } = detectCircularWait(alloc, need, avail, processes, resources);

  return {
    mutualExclusion,
    holdAndWait,
    noPreemption,
    circularWait: hasCycle,
    cycles,
  };
}

// ─── Circular Wait / Cycle Detection ────────────────────────────────────────
function detectCircularWait(alloc, need, avail, processes, resources) {
  // Build wait-for graph: process i waits for process j if:
  // i needs a resource that j holds, and that resource is not available
  const waitFor = Array.from({ length: processes }, () => new Set());
  
  for (let i = 0; i < processes; i++) {
    for (let j = 0; j < resources; j++) {
      if (need[i][j] > avail[j]) {
        // Process i is waiting for resource j — who holds it?
        for (let k = 0; k < processes; k++) {
          if (k !== i && alloc[k][j] > 0) {
            waitFor[i].add(k);
          }
        }
      }
    }
  }

  // Find cycles using DFS
  const cycles = [];
  const visited = new Array(processes).fill(0); // 0=white, 1=gray, 2=black
  const path = [];

  function dfs(node) {
    visited[node] = 1;
    path.push(node);
    for (const neighbor of waitFor[node]) {
      if (visited[neighbor] === 1) {
        // Found cycle
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart);
        cycles.push([...cycle, neighbor]);
      } else if (visited[neighbor] === 0) {
        dfs(neighbor);
      }
    }
    path.pop();
    visited[node] = 2;
  }

  for (let i = 0; i < processes; i++) {
    if (visited[i] === 0) dfs(i);
  }

  return { hasCycle: cycles.length > 0, cycles, waitFor };
}

// ─── Resource Utilization ───────────────────────────────────────────────────
export function calcResourceUtilization(allocation, totalResources, processes, resources) {
  const total = totalResources.map(Number);
  const utilization = [];
  
  for (let j = 0; j < resources; j++) {
    let allocated = 0;
    for (let i = 0; i < processes; i++) allocated += Number(allocation[i][j]);
    const percentage = total[j] > 0 ? Math.round((allocated / total[j]) * 100) : 0;
    utilization.push({ resource: `R${j}`, allocated, total: total[j], percentage });
  }
  
  return utilization;
}

// ─── Waiting Dependencies ───────────────────────────────────────────────────
export function calcWaitingDependencies(allocation, maximum, totalResources, processes, resources) {
  const alloc = allocation.map(r => r.map(Number));
  const max = maximum.map(r => r.map(Number));
  const total = totalResources.map(Number);
  const need = calcNeed(alloc, max, processes, resources);
  const avail = calcAvailable(total, alloc, processes, resources);

  const dependencies = [];
  
  for (let i = 0; i < processes; i++) {
    for (let j = 0; j < resources; j++) {
      if (need[i][j] > avail[j]) {
        for (let k = 0; k < processes; k++) {
          if (k !== i && alloc[k][j] > 0) {
            dependencies.push({
              waiting: `P${i}`,
              waitingFor: `P${k}`,
              resource: `R${j}`,
              needed: need[i][j],
              held: alloc[k][j],
            });
          }
        }
      }
    }
  }

  const waitingProcesses = [...new Set(dependencies.map(d => d.waiting))];
  return { dependencies, waitingCount: waitingProcesses.length };
}

// ─── Full Smart Analysis ────────────────────────────────────────────────────
export function runSmartAnalysis({ processes, resources, totalResources, allocation, maximum }) {
  const p = Number(processes);
  const r = Number(resources);

  // Step 1: Validate
  const errors = validateInputs({ processes: p, resources: r, totalResources, allocation, maximum });
  if (errors.length > 0) return { valid: false, errors };

  // Step 2: Deadlock conditions
  const conditions = checkDeadlockConditions(allocation, maximum, totalResources, p, r);

  // Step 3: Resource utilization
  const utilization = calcResourceUtilization(allocation, totalResources, p, r);

  // Step 4: Waiting dependencies
  const waiting = calcWaitingDependencies(allocation, maximum, totalResources, p, r);

  // Step 5: Circular dependency (already computed in conditions)
  const circularDep = { hasCycle: conditions.circularWait, cycles: conditions.cycles };

  // Step 6: Safe sequence
  const bankers = bankersAlgorithm(allocation, maximum, totalResources, p, r);

  // Step 7: System state
  let systemState;
  if (bankers.isSafe) {
    systemState = 'SAFE';
  } else if (conditions.circularWait) {
    systemState = 'DEADLOCKED';
  } else {
    systemState = 'UNSAFE';
  }

  // Step 8: Recommendation
  let recommendation;
  if (systemState === 'SAFE') {
    recommendation = {
      action: 'No action required',
      detail: 'The system is in a safe state. All processes can complete successfully.',
      mode: null,
    };
  } else if (systemState === 'UNSAFE') {
    recommendation = {
      action: 'Use Banker\'s Algorithm (Deadlock Avoidance)',
      detail: 'The system is unsafe — future deadlock is possible. Apply Banker\'s Algorithm to avoid deadlock.',
      mode: 'Quick Mode → Tab 1',
    };
  } else {
    recommendation = {
      action: 'Use RAG + Recovery (Deadlock Detection & Recovery)',
      detail: 'The system is deadlocked — processes cannot proceed. Use detection and recovery to resolve.',
      mode: 'Quick Mode → Tab 2',
    };
  }

  return {
    valid: true,
    conditions,
    utilization,
    waiting,
    circularDep,
    bankers,
    systemState,
    recommendation,
    timestamp: new Date().toISOString(),
  };
}
