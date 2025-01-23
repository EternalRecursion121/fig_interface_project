<script>
  import { scenario } from '$lib/stores/scenarioStore';
  import ParameterGroup from './ParameterGroup.svelte';
</script>

<div class="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-xl shadow-lg border border-gray-700">
  <h2 class="text-2xl font-semibold mb-6 text-gray-100 border-b border-gray-700 pb-4">
    Shape Your Scenario
  </h2>
  
  <ParameterGroup 
    label="Speed" 
    tooltip="How quickly digital minds' welfare capacity increases"
  >
    <select 
      class="w-full p-3 border rounded-xl bg-gray-900 hover:bg-gray-800 transition-colors text-gray-300
             border-gray-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
      bind:value={$scenario.speed.type}
    >
      <option value="slow">Slow</option>
      <option value="moderate">Moderate</option>
      <option value="fast">Fast</option>
    </select>
  </ParameterGroup>

  <ParameterGroup 
    label="Start Year" 
    tooltip="When does the takeoff begin?"
  >
    <input 
      type="range" 
      min="2025" 
      max="2045" 
      class="w-full accent-primary"
      bind:value={$scenario.timing.startYear}
    >
    <div class="text-sm text-gray-300 font-mono">📅 {$scenario.timing.startYear}</div>
  </ParameterGroup>

  <ParameterGroup 
    label="Maximum Altitude" 
    tooltip="The peak welfare capacity level"
  >
    <select 
      class="w-full p-3 border rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors text-gray-300"
      bind:value={$scenario.maxAltitude.type}
    >
      <option value="low">📊 Low (~1T human equivalent)</option>
      <option value="high">📈 High (100T+ human equivalent)</option>
    </select>
  </ParameterGroup>

  <ParameterGroup 
    label="Progression Style" 
    tooltip="How smooth is the growth?"
  >
    <select 
      class="w-full p-3 border rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors text-gray-300"
      bind:value={$scenario.progression.type}
    >
      <option value="gradual">📉 Gradual</option>
      <option value="discontinuous">📊 Discontinuous</option>
    </select>
  </ParameterGroup>

  <h3 class="text-lg font-semibold mb-6 text-gray-100 border-b border-gray-700 pb-4 mt-12">
    Advanced Considerations
  </h3>

  <ParameterGroup 
    label="Existential Security" 
    tooltip="Is humanity secure from existential risks?"
  >
    <select 
      class="w-full p-3 border rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors text-gray-300"
      value={$scenario.timing.existentialSecurityAligned ? "true" : "false"}
      on:change={(e) => {
        $scenario.timing.existentialSecurityAligned = e.target.value === "true";
      }}
    >
      <option value="false">⚠️ Pre-Security</option>
      <option value="true">🛡️ Post-Security</option>
    </select>
  </ParameterGroup>

  <ParameterGroup 
    label="Launch Height" 
    tooltip="Initial welfare capacity level"
  >
    <select 
      class="w-full p-3 border rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors text-gray-300"
      bind:value={$scenario.launchHeight.type}
    >
      <option value="low">🌱 Low Launch</option>
      <option value="high">🚀 High Launch</option>
    </select>
  </ParameterGroup>

  <ParameterGroup 
    label="Moral Consideration" 
    tooltip="How does moral consideration evolve with welfare capacity?"
  >
    <select 
      class="w-full p-3 border rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors text-gray-300 mb-2"
      bind:value={$scenario.moralConsideration.type}
    >
      <option value="coupled">🤝 Coupled Progress</option>
      <option value="uncoupled">↔️ Uncoupled Progress</option>
      <option value="decoupling">📉 Decoupling Progress</option>
      <option value="delayed">⏳ Delayed Progress</option>
    </select>
    <input 
      type="range" 
      min="0" 
      max="1" 
      step="0.1"
      class="w-full accent-primary"
      bind:value={$scenario.moralConsideration.level}
    >
    <div class="text-sm text-gray-300 font-mono">Level: {$scenario.moralConsideration.level.toFixed(1)}</div>
  </ParameterGroup>
</div>

<style>
  /* Move relevant control styles here */
</style> 