// Helper function to solve for k in the logistic function
function solveK(t0, tMid, minC, maxC, cAtTenYears) {
  // Using the formula derived in the explanation:
  // cAtTenYears = minC + (maxC - minC) / (1 + exp(-k * (t0+10 - tMid)))
  const target = (cAtTenYears - minC) / (maxC - minC);
  const timeSpan = t0 + 10 - tMid; // Should be 5 if tMid = t0 + 5
  const k = -Math.log((1/target - 1)) / timeSpan;
  return k;
}

function logisticCapacity(t, scenario) {
  const t0 = scenario.timing.startYear;
  const minCap = scenario.expectedValue.initialCapacity;
  const maxCap = scenario.expectedValue.maxCapacity;
  const tenYearCap = scenario.expectedValue.capacityAfterTenYears;
  const tMid = t0 + 5; // Midpoint 5 years after start
  
  // Solve for k using the helper function
  const k = solveK(t0, tMid, minCap, maxCap, tenYearCap);
  
  // Return the logistic function value
  return minCap + (maxCap - minCap) / (1 + Math.exp(-k * (t - tMid)));
}

export function generateCurveData(scenario) {
  const points = 100;
  const startYear = 2025;
  const endYear = 2085;
  const yearRange = endYear - startYear;
  
  return Array.from({length: points}, (_, i) => {
    const x = startYear + (i * yearRange/points);
    
    // Before start year, return initial capacity
    if (x < scenario.timing.startYear) {
      return { x, y: scenario.expectedValue.initialCapacity };
    }
    
    // Calculate y using logistic function
    let y = logisticCapacity(x, scenario);
    
    // Apply credence and moral consideration
    const credence = (scenario.expectedValue?.credence || 50) / 100;
    const moralLevel = scenario.moralConsideration.level;
    y = y * credence * moralLevel;
    
    // Ensure minimum value
    y = Math.max(1e6, y);
    
    return {x, y};
  });
}

export function generateMoralConsiderationData(scenario) {
  const points = 100;
  const startYear = 2025;
  const endYear = 2085;
  const yearRange = endYear - startYear;
  
  return Array.from({length: points}, (_, i) => {
    const x = startYear + (i * yearRange/points);
    if (x < scenario.timing.startYear) {
      return { x, y: 1e6 };
    }

    const progress = i/points;
    const baseY = generateCurveData(scenario)[i].y;
    const level = scenario.moralConsideration.level;
    
    let y;
    switch(scenario.moralConsideration.type) {
      case 'coupled':
        y = baseY * level;
        break;
      case 'uncoupled':
        y = 1e8 * level;
        break;
      case 'decoupling':
        y = progress < 0.5 ? 
          baseY * level : 
          baseY * level * Math.pow(0.5, (progress-0.5)*10);
        break;
      case 'delayed':
        const transitionPoint = 0.7;
        const transitionWidth = 0.05;
        if (progress < transitionPoint - transitionWidth) {
          y = 1e7 * level;
        } else if (progress > transitionPoint + transitionWidth) {
          y = baseY * level;
        } else {
          const t = (progress - (transitionPoint - transitionWidth)) / (2 * transitionWidth);
          y = (1e7 * level) * (1-t) + (baseY * level) * t;
        }
        break;
    }
    return {x, y};
  });
} 