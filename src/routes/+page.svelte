<script>
  import { onMount, tick } from 'svelte';
  import * as d3 from 'd3';
  import StoryNarrator from '$lib/components/StoryNarrator.svelte';
  import InitialSurveyModal from '$lib/components/InitialSurveyModal.svelte';
  import { scenario } from '$lib/stores/scenarioStore';
  import WelfareGraph from '$lib/components/WelfareGraph.svelte';
  import ScenarioControls from '$lib/components/ScenarioControls.svelte';

  let graphContainer;
  let svg;
  let width;
  let height = 400;
  let margin = { top: 20, right: 150, bottom: 30, left: 120 };

  // Add showSurvey state
  let showSurvey = true;

  // Modified scenario state
  let currentYear = 2025;

  // First add the constant near the top of the file
  const HUMAN_POPULATION_WELFARE = 8e9; // ~8 billion humans as reference

  // Initialize xScale with default values
  let xScale = d3.scaleLinear()
    .domain([2025, 2085])
    .range([0, 100]);

  // Make xScale reactive to width changes
  $: if (width && margin) {
    xScale = d3.scaleLinear()
      .domain([2025, 2085])
      .range([margin.left, width - margin.right]);
  }

  // Add yScale definition near the other scale definitions
  let yScale = d3.scaleLog()
    .domain([1e6, 1e14])
    .range([0, 100]);

  // Make yScale reactive to height and margin changes
  $: if (height && margin) {
    yScale = d3.scaleLog()
      .domain([1e6, Math.max(
        HUMAN_POPULATION_WELFARE * 1000,  // Show up to 1000x human population
        $scenario.maxAltitude.type === 'low' ? 1e12 : 1e14  // 1T or 100T
      )])
      .range([height - margin.bottom, margin.top]);
  }

  // Update the marker position reactively
  $: if (svg && xScale && width) {  // Add width check
    svg.selectAll('.current-year-marker').remove();
    
    // Add new marker with all components
    const marker = svg.append('g')
      .attr('class', 'current-year-marker');

    marker.append('line')
      .attr('x1', xScale(currentYear))
      .attr('x2', xScale(currentYear))
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4');

    const currentPoint = generateCurveData().find(d => Math.abs(d.x - currentYear) < 0.5);
    if (currentPoint) {
      marker.append('circle')
        .attr('cx', xScale(currentPoint.x))
        .attr('cy', yScale(currentPoint.y))
        .attr('r', 4)
        .attr('fill', '#ffffff');

      const annotationGroup = marker.append('g')
        .attr('transform', `translate(${xScale(currentPoint.x) + 10}, ${yScale(currentPoint.y) - 20})`);

      annotationGroup.append('rect')
        .attr('x', -5)
        .attr('y', -15)
        .attr('width', 160)
        .attr('height', 40)
        .attr('fill', '#1f2937')
        .attr('stroke', '#4b5563')
        .attr('rx', 4)
        .attr('opacity', 0.9);

      annotationGroup.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('fill', '#ffffff')
        .attr('font-size', '12px')
        .text(`Year: ${currentYear}`);

      annotationGroup.append('text')
        .attr('x', 0)
        .attr('y', 15)
        .attr('fill', '#9ca3af')
        .attr('font-size', '12px')
        .text(formatWelfareCapacity(currentPoint.y));
    }
  }

  export function generateCurveData() {
    const points = 100;
    const startYear = 2025;
    const endYear = 2085;
    const yearRange = endYear - startYear;
    
    return Array.from({length: points}, (_, i) => {
      const x = startYear + (i * yearRange/points);
      if (x < $scenario.timing.startYear) {
        return { x, y: 1e6 };
      }
      
      let y;
      const initialValue = Math.max(1e6, $scenario.expectedValue?.initialCapacity || 
                          ($scenario.launchHeight.type === 'high' ? 1e8 : 1e6));
      
      const progress = i/points;
      
      if ($scenario.progression.type === 'discontinuous') {
        // Create sharper jumps at specific points
        const jumpPoints = [0.3, 0.5, 0.7];
        const jumpIndex = jumpPoints.findIndex(jp => progress < jp);
        
        // Base growth rate depends on speed
        const growthRate = 
          $scenario.speed.type === 'fast' ? 5 :
          $scenario.speed.type === 'moderate' ? 4 : 3;
        
        // Calculate base value with exponential growth
        const baseY = initialValue * Math.pow(10, progress * growthRate);
        
        // Apply jumps
        y = baseY * (jumpIndex >= 0 ? Math.pow(10, jumpIndex + 1) : 1);
      } else {
        // Smoother growth for gradual progression
        const growthRate = 
          $scenario.speed.type === 'fast' ? 5 :
          $scenario.speed.type === 'moderate' ? 4 : 3;
        
        y = initialValue * Math.pow(10, progress * growthRate);
      }

      // Apply maximum altitude limit
      const maxY = $scenario.expectedValue?.maxCapacity || 
                  ($scenario.maxAltitude.type === 'low' ? 1e12 : 1e14);
      y = Math.min(y, maxY);

      // Apply credence and moral consideration
      const credence = ($scenario.expectedValue?.credence || 50) / 100;
      const moralLevel = $scenario.moralConsideration.level;
      y = y * credence * moralLevel;

      // Ensure minimum value
      y = Math.max(1e6, y);

      return {x, y};
    });
  }

  function formatPowerOfTen(d) {
    const power = Math.floor(Math.log10(d));
    if (power === 6) return "1M";
    if (power === 7) return "10M";
    if (power === 8) return "100M";
    if (power === 9) return "1B";
    if (power === 10) return "10B";
    if (power === 11) return "100B";
    if (power === 12) return "1T";
    if (power === 13) return "10T";
    if (power === 14) return "100T";
    return `10^${power}`;
  }

  function generateMoralConsiderationData() {
    const points = 100;
    const startYear = 2025;  // Always start from 2025
    const endYear = 2085;
    const yearRange = endYear - startYear;
    
    return Array.from({length: points}, (_, i) => {
      const x = startYear + (i * yearRange/points);
      if (x < $scenario.timing.startYear) {
        return { x, y: 1e6 };
      }

      const progress = i/points;
      const baseY = generateCurveData()[i].y;
      const level = $scenario.moralConsideration.level;
      
      let y;
      switch($scenario.moralConsideration.type) {
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
          // Create a sharper transition
          const transitionPoint = 0.7;
          const transitionWidth = 0.05;  // Narrower transition
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

  function updateGraph() {
    if (!graphContainer) return;

    // Clear previous SVG
    d3.select(graphContainer).selectAll("*").remove();

    // Get container width
    width = graphContainer.clientWidth;

    // Create new SVG
    svg = d3.select(graphContainer)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('style', 'max-width: 100%; height: auto;');

    // Wait for xScale to be properly initialized with the correct width
    if (!width) return;

    // Add axes with more specific ticks
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale)
        .tickValues([2025, 2035, 2045, 2055, 2065, 2075, 2085])  // Explicit decade ticks
        .tickFormat(d3.format('d')));

    // Add grid lines with same tick values
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale)
        .tickValues([2025, 2035, 2045, 2055, 2065, 2075, 2085])
        .tickSize(-height + margin.top + margin.bottom)
        .tickFormat(''))
      .style('stroke-opacity', 0.2);

    // Improved y-axis with better tick values and formatting
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale)
        .tickValues([1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14])
        .tickFormat(formatPowerOfTen))
      .call(g => g.selectAll('.tick text')
        .style('font-size', '12px'));

    // Add labels
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 5)
      .attr('text-anchor', 'middle')
      .text('Year');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .text('Welfare Capacity');

    // Generate and add welfare capacity curve
    const curveData = generateCurveData();
    
    const line = d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Add existential security background
    if (!$scenario.timing.existentialSecurityAligned) {
      svg.append('rect')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', width - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom)
        .attr('fill', 'rgba(239, 68, 68, 0.1)')
        .attr('class', 'existential-risk-zone');
    }

    // Add welfare capacity curve
    svg.append('path')
      .datum(curveData)
      .attr('fill', 'none')
      .attr('stroke', '#60a5fa')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add moral consideration line if not uncoupled
    if ($scenario.moralConsideration.type !== 'uncoupled') {
      const moralConsiderationData = generateMoralConsiderationData();
      const lineWithGaps = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .defined(d => d.y >= 1e6)  // Only draw line for points above minimum
        .curve(d3.curveMonotoneX);

      svg.append('path')
        .datum(moralConsiderationData)
        .attr('fill', 'none')
        .attr('stroke', '#34d399')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('d', lineWithGaps);
    }

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - margin.right + 20}, ${margin.top + 10})`);

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#60a5fa')
      .attr('stroke-width', 2);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 4)
      .attr('class', 'text-sm')
      .text('Welfare Capacity');

    if ($scenario.moralConsideration.type !== 'uncoupled') {
      legend.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 20)
        .attr('y2', 20)
        .attr('stroke', '#34d399')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4');

      legend.append('text')
        .attr('x', 25)
        .attr('y', 24)
        .attr('class', 'text-sm')
        .text('Moral Consideration');
    }

    // Update legend to include human population reference
    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 40) // Position below existing legend items
      .attr('y2', 40)
      .attr('stroke', '#fbbf24')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4');

    legend.append('text')
      .attr('x', 25)
      .attr('y', 44)
      .attr('class', 'text-sm')
      .attr('fill', '#fbbf24')
      .text('Human Population (~8B)');

    // Add title based on current scenario
    svg.append('text')
      .attr('x', width/2)
      .attr('y', margin.top)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-lg font-semibold')
      .text(() => {
        const speed = $scenario.speed.type === 'fast' ? 'Fast' : 'Slow';
        const progression = $scenario.progression.type === 'gradual' ? 'Gradual' : 'Discontinuous';
        return `${speed} ${progression} Takeoff`;
      });

    // Update axis colors
    svg.selectAll('.domain')
      .style('stroke', '#4b5563');
    
    svg.selectAll('.tick line')
      .style('stroke', '#374151');

    svg.selectAll('.tick text')
      .style('fill', '#9ca3af');

    // Update graph title and labels color
    svg.selectAll('text')
      .style('fill', '#9ca3af');
  }

  // Handle window resize
  let resizeTimer;
  function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateGraph();
    }, 250);
  }

  onMount(() => {
    updateGraph();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  // Watch for scenario changes
  $: $scenario, updateGraph();

  // Add state to control narrative generation
  let shouldGenerateNarrative = false;

  // Update survey completion handler
  async function handleSurveyComplete(event) {
    $scenario = event.detail;
    showSurvey = false;
    shouldGenerateNarrative = true;
    
    await tick();
    if (storyNarratorComponent) {
      await storyNarratorComponent.generateAllNarrations();
    }
  }

  // Add a bind to get access to StoryNarrator methods
  let storyNarratorComponent;

  // Add this helper function for formatting large numbers
  function formatWelfareCapacity(value) {
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B human-equivalents`;
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M human-equivalents`;
    }
    return `${value.toFixed(0)} human-equivalents`;
  }
</script>

{#if showSurvey}
  <InitialSurveyModal on:complete={handleSurveyComplete} />
{/if}

<div class="container mx-auto p-6 font-sans text-gray-100">
  <h1 class="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
    Digital Minds Takeoff Explorer
  </h1>
  <p class="text-gray-400 mb-8 max-w-2xl">
    Explore different scenarios for how digital minds might develop and their impact on welfare capacity over time.
  </p>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <ScenarioControls />
    
    <div class="md:col-span-2">
      <div class="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-xl shadow-lg border border-gray-700">
        <div class="mb-6">
          <h3 class="text-xl font-medium text-gray-100 mb-2">
            {$scenario.speed.type === 'fast' ? 'Fast' : 'Slow'} 
            {$scenario.progression.type === 'gradual' ? 'Gradual' : 'Discontinuous'} Takeoff
          </h3>
          <p class="text-gray-400 text-sm">
            Visualizing how digital minds might develop under these conditions
          </p>
        </div>
        
        <WelfareGraph {currentYear} />
      </div>

      <div class="mt-6 bg-gray-800 p-4 rounded-xl border border-gray-700">
        <div class="flex items-center gap-4">
          <h3 class="font-medium text-gray-300">Timeline</h3>
          <input 
            type="range" 
            min="2025" 
            max="2085" 
            step="10"
            class="w-full accent-primary"
            bind:value={currentYear}
          >
          <div class="text-gray-300 font-mono w-16">{currentYear}</div>
        </div>

        <!-- Add discrete year markers below the slider -->
        <div class="mt-2 flex justify-between text-xs text-gray-400 px-1">
          {#each Array.from({length: 7}, (_, i) => 2025 + i * 10) as year}
            <span>{year}</span>
          {/each}
        </div>

        <button 
          class="mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 
                 text-white rounded-lg hover:opacity-90 transition-opacity"
          on:click={() => {
            const tempYear = currentYear;
            currentYear = null;
            setTimeout(() => currentYear = tempYear, 0);
          }}
        >
          Regenerate Timeline
        </button>
      </div>

      <StoryNarrator 
        bind:this={storyNarratorComponent}
        scenario={$scenario}
        {currentYear}
        shouldGenerate={shouldGenerateNarrative}
      />
    </div>
  </div>
</div>

<style>
  :global(body) {
    background-color: #111827; /* gray-900 */
    background-image: radial-gradient(#374151 0.5px, transparent 0.5px);
    background-size: 15px 15px;
  }
</style>
