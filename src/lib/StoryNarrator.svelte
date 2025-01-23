<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  export let scenario;
  export let currentYear;
  export let generateCurveData;  // Add this prop
  export let shouldGenerate = false;  // Add this prop to control generation

  let narratives = {};
  let loading = false;
  let error = null;
  let progress = 0;
  let generationInProgress = false;  // Flag to prevent multiple simultaneous generations
  const timePoints = Array.from({length: 7}, (_, i) => 2025 + i * 10).filter(year => 
    year >= scenario.timing.startYear && year <= 2085
  );

  onMount(() => {
    // No longer auto-generate
  });

  // Add function to calculate current capacity level from graph data
  function getCurrentCapacityLevel() {
    const curveData = generateCurveData(); // Import from +page.svelte
    const nearestPoint = curveData.find(point => point.x >= currentYear) || curveData[curveData.length - 1];
    return nearestPoint?.y;
  }

  async function generateAllNarrations() {
    try {
      loading = true;
      error = null;
      progress = 0;

      // Get years at decade intervals
      const years = Array.from(
        { length: 7 }, 
        (_, i) => 2025 + (i * 10)
      );

      const response = await fetch('/api/generate_timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, years, currentYear })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'progress') {
              progress = data.progress;
            } else if (data.type === 'complete') {
              narratives = data.narratives;
            }
          }
        }
      }

    } catch (e) {
      console.error('Error generating narrations:', e);
      error = e.message;
    } finally {
      loading = false;
    }
  }

  let debounceTimer;
  // Regenerate all narratives when scenario changes
  $: {
    console.log('StoryNarrator received new scenario:', scenario);
    if (browser && shouldGenerate) {  // Only generate if shouldGenerate is true
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        console.log('Debounced scenario update, clearing narratives');
        narratives = {};
        await generateAllNarrations();
      }, 500);
    }
  }

  $: currentNarration = narratives[
    timePoints.find(year => year >= currentYear) || 
    timePoints[timePoints.length - 1]
  ] || 'Loading...';
</script>

<div class="mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-xl font-medium text-gray-100">Historical Timeline</h3>
    <div class="text-gray-400 text-sm">Year: {currentYear}</div>
  </div>
  
  {#if loading}
    <div class="flex flex-col items-center justify-center py-8 space-y-4">
      <div class="w-full max-w-xs bg-gray-700 rounded-full h-2.5">
        <div class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-300" 
             style="width: {progress}%">
        </div>
      </div>
      <div class="text-gray-400 text-sm">
        {#if progress === 0}
          Initializing timeline generation...
        {:else}
          Generating historical timeline... {Math.round(progress)}%
        {/if}
      </div>
    </div>
  {:else if error}
    <div class="text-red-400">Error: {error}</div>
  {:else if Object.keys(narratives).length > 0}
    <div class="space-y-6">
      {#each Object.entries(narratives) as [year, narrative]}
        <div class="bg-gray-900 p-4 rounded-lg">
          <h3 class="text-lg font-medium text-gray-300 mb-2">{year}</h3>
          <p class="text-gray-400 whitespace-pre-wrap">{narrative}</p>
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-gray-400">No timeline generated yet.</p>
  {/if}

  <!-- Timeline Navigation -->
  <div class="mt-8 flex flex-wrap gap-2">
    {#each timePoints as year}
      <button
        class="px-3 py-1 text-sm rounded-full transition-colors
               {year <= currentYear ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300'}"
        on:click={() => currentYear = year}
      >
        {year}
      </button>
    {/each}
  </div>
</div>

<style>
  /* Add smooth transitions for progress bar */
  .rounded-full {
    transition: width 0.3s ease-in-out;
  }
</style> 