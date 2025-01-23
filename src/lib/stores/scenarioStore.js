import { writable } from 'svelte/store';

const defaultScenario = {
  speed: {
    type: 'moderate'
  },
  timing: {
    startYear: 2025,
    existentialSecurityAligned: false
  },
  maxAltitude: {
    type: 'low'
  },
  launchHeight: {
    type: 'low'
  },
  progression: {
    type: 'gradual'
  },
  moralConsideration: {
    type: 'delayed',
    level: 0.5
  },
  expectedValue: {
    credence: 50,
    initialCapacity: 1e6,
    maxCapacity: 1e10
  }
};

export const scenario = writable(defaultScenario); 