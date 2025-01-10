<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  let graphContainer;
  let svg;
  let width;
  let height = 400;
  let margin = { top: 20, right: 20, bottom: 30, left: 80 };

  // Modified scenario state
  let scenario = {
    speed: {
      type: 'slow'
    },
    timing: {
      startYear: 2024,
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
    distribution: {
      type: 'uniform'
    },
    moralConsideration: {
      type: 'coupled',
      level: 0.5
    }
  };

  function generateCurveData() {
    const points = 100;
    const startYear = scenario.timing.startYear;
    const endYear = 2044;
    const yearRange = endYear - startYear;
    
    return Array.from({length: points}, (_, i) => {
      const x = startYear + (i * yearRange/points);
      let y;
      
      // Set initial value based on launch height
      const initialValue = scenario.launchHeight.type === 'high' ? 1e8 : 1e6;
      
      if (scenario.progression.type === 'discontinuous') {
        // Create more dramatic jumps for discontinuous progression
        const jumpPoints = [0.3, 0.6, 0.8];
        const jumpIndex = jumpPoints.findIndex(jp => i/points < jp);
        const baseY = initialValue * Math.pow(10, (i/points) * (scenario.speed.type === 'fast' ? 4 : 2));
        y = baseY * (jumpIndex >= 0 ? Math.pow(4, jumpIndex + 1) : 1);
      } else {
        // Gradual progression
        if (scenario.speed.type === 'fast') {
          y = initialValue * Math.pow(10, (i/points) * 4); // Exponential growth
        } else {
          y = initialValue * Math.pow(10, (i/points) * 2); // Slower growth
        }
      }

      // Apply maximum altitude limit
      const maxY = scenario.maxAltitude.type === 'low' ? 1e10 : 1e11;
      y = Math.min(y, maxY);

      return {x, y};
    });
  }

  function generateMultipleCurves() {
    if (scenario.distribution.type === 'disuniform') {
      // Generate 3 different curves for disuniform takeoff
      return [0, 1, 2].map(offset => {
        return Array.from({length: 100}, (_, i) => {
          const x = scenario.timing.startYear + (i * (2044 - scenario.timing.startYear)/100);
          const initialValue = scenario.launchHeight.type === 'high' ? 1e8 : 1e6;
          let y;

          if (scenario.progression.type === 'discontinuous') {
            // Create different jump points for each curve
            const jumpPoints = [
              [0.3, 0.6, 0.8],
              [0.25, 0.55, 0.75],
              [0.35, 0.65, 0.85]
            ][offset];
            
            const jumpIndex = jumpPoints.findIndex(jp => i/100 < jp);
            const baseY = initialValue * Math.pow(10, (i/100) * (scenario.speed.type === 'fast' ? 4 : 2));
            y = baseY * (jumpIndex >= 0 ? Math.pow(4, jumpIndex + 1) : 1);
            
            // Add some variation between curves
            y *= (1 + (offset - 1) * 0.3);
          } else {
            // Gradual progression with variation
            const progress = i/100;
            const variationFactor = 1 + Math.sin(progress * Math.PI * 2 + offset * Math.PI/2) * 0.3;
            
            if (scenario.speed.type === 'fast') {
              y = initialValue * Math.pow(10, progress * 4) * variationFactor;
            } else {
              y = initialValue * Math.pow(10, progress * 2) * variationFactor;
            }
          }

          // Apply maximum altitude limit
          const maxY = scenario.maxAltitude.type === 'low' ? 1e10 : 1e11;
          y = Math.min(y, maxY);

          return {x, y};
        });
      });
    }
    return [generateCurveData()];
  }

  function formatPowerOfTen(d) {
    const power = Math.floor(Math.log10(d));
    if (power === 6) return "1M";
    if (power === 7) return "10M";
    if (power === 8) return "100M";
    if (power === 9) return "1B";
    if (power === 10) return "10B";
    if (power === 11) return "100B";
    return `10^${power}`;
  }

  function generateMoralConsiderationData() {
    const points = 100;
    const startYear = scenario.timing.startYear;
    const endYear = 2044;
    const yearRange = endYear - startYear;
    
    return Array.from({length: points}, (_, i) => {
      const x = startYear + (i * yearRange/points);
      let y;
      const progress = i/points;
      const baseY = generateCurveData()[i].y;
      const level = scenario.moralConsideration.level; // Use the slider value
      
      switch(scenario.moralConsideration.type) {
        case 'coupled':
          // Follows welfare capacity curve, scaled by level
          y = baseY * level;
          break;
        case 'uncoupled':
          // Stays flat at level
          y = 1e8 * level;
          break;
        case 'decoupling':
          // Starts coupled but diverges, affected by level
          y = progress < 0.5 ? 
            baseY * level : 
            baseY * level * Math.pow(0.8, (progress-0.5)*10);
          break;
        case 'delayed':
          // Starts low then catches up, scaled by level
          y = progress < 0.7 ? 
            1e7 * level : 
            baseY * level;
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

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([2024, 2044])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLog()
      .domain([1e6, scenario.maxAltitude.type === 'low' ? 1e10 : 1e11])
      .range([height - margin.bottom, margin.top]);

    // Add grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale)
        .ticks(10)
        .tickSize(-height + margin.top + margin.bottom)
        .tickFormat(''))
      .style('stroke-opacity', 0.2);

    // Add vertical grid lines for y-axis
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale)
        .tickValues([1e6, 1e7, 1e8, 1e9, 1e10, 1e11])
        .tickSize(-width + margin.left + margin.right)
        .tickFormat(''))
      .style('stroke-opacity', 0.2);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale)
        .ticks(5)
        .tickFormat(d3.format('d')));

    // Improved y-axis with better tick values and formatting
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale)
        .tickValues([1e6, 1e7, 1e8, 1e9, 1e10, 1e11])
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

    // Generate and add welfare capacity curves
    const curves = generateMultipleCurves();
    
    const line = d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Add existential security background
    if (!scenario.timing.existentialSecurityAligned) {
      svg.append('rect')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', width - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom)
        .attr('fill', 'rgba(239, 68, 68, 0.1)')
        .attr('class', 'existential-risk-zone');
    }

    // Add welfare capacity curves
    curves.forEach((curveData, i) => {
      svg.append('path')
        .datum(curveData)
        .attr('fill', 'none')
        .attr('stroke', scenario.distribution.type === 'disuniform' ? 
          d3.schemeSet2[i] : '#60a5fa')
        .attr('stroke-width', 2)
        .attr('d', line);
    });

    // Add moral consideration line if not uncoupled
    if (scenario.moralConsideration.type !== 'uncoupled') {
      const moralConsiderationData = generateMoralConsiderationData();
      svg.append('path')
        .datum(moralConsiderationData)
        .attr('fill', 'none')
        .attr('stroke', '#34d399')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('d', line);
    }

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, ${margin.top + 10})`);

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

    if (scenario.moralConsideration.type !== 'uncoupled') {
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

    // Add title based on current scenario
    svg.append('text')
      .attr('x', width/2)
      .attr('y', margin.top)
      .attr('text-anchor', 'middle')
      .attr('class', 'text-lg font-semibold')
      .text(() => {
        const speed = scenario.speed.type === 'fast' ? 'Fast' : 'Slow';
        const progression = scenario.progression.type === 'gradual' ? 'Gradual' : 'Discontinuous';
        const distribution = scenario.distribution.type === 'uniform' ? 'Uniform' : 'Disuniform';
        return `${speed} ${progression} ${distribution} Takeoff`;
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
  $: scenario, updateGraph();
</script>

<div class="container mx-auto p-6 font-sans text-gray-100">
  <h1 class="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
    Digital Minds Takeoff Explorer
  </h1>
  <p class="text-gray-400 mb-8 max-w-2xl">
    Explore different scenarios for how digital minds might develop and their impact on welfare capacity over time.
  </p>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <!-- Left sidebar: Controls -->
    <div class="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-xl shadow-lg border border-gray-700">
      <h2 class="text-2xl font-semibold mb-6 text-gray-100 border-b border-gray-700 pb-4">
        Shape Your Scenario
      </h2>
      
      <!-- Speed Control -->
      <div class="parameter-group">
        <div class="flex items-center gap-2 mb-2">
          <h3 class="font-medium text-gray-300">Speed</h3>
          <div class="group relative inline-block">
            <div class="cursor-help text-gray-500 hover:text-gray-300 text-sm">(what's this?)</div>
            <div class="invisible group-hover:visible absolute z-10 w-64 p-3 mt-1 text-sm leading-relaxed text-gray-300 bg-gray-800 rounded-xl shadow-xl border border-gray-700 -translate-x-1/2 left-1/2">
              <span class="block font-medium mb-1">Takeoff Speed</span>
              How quickly digital minds' welfare capacity increases - this can dramatically affect how prepared we are for their emergence.
            </div>
          </div>
        </div>
        <div class="relative">
          <select 
            class="w-full p-3 border rounded-xl bg-gray-900 hover:bg-gray-800 transition-colors text-gray-300
                   border-gray-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            bind:value={scenario.speed.type}
          >
            <option value="slow">Slow</option>
            <option value="fast">Fast</option>
          </select>
        </div>
      </div>

      <!-- Timing Control -->
      <div class="parameter-group mt-6">
        <div class="flex items-center gap-2 mb-2">
          <h3 class="font-medium text-gray-300">Start Year</h3>
          <div class="group relative inline-block">
            <div class="cursor-help text-gray-500 hover:text-gray-300">ℹ️</div>
            <div class="invisible group-hover:visible absolute z-10 w-48 p-2 mt-1 text-sm text-gray-300 bg-gray-800 rounded-lg shadow-lg border border-gray-700 -translate-x-1/2 left-1/2">
              When does the takeoff begin?
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <input 
            type="range" 
            min="2024" 
            max="2044" 
            class="w-full accent-primary"
            bind:value={scenario.timing.startYear}
          >
          <div class="text-sm text-gray-300 font-mono">📅 {scenario.timing.startYear}</div>
        </div>
      </div>

      <!-- Maximum Altitude -->
      <div class="parameter-group mt-6">
        <div class="flex items-center gap-2 mb-2">
          <h3 class="font-medium text-gray-300">Maximum Altitude</h3>
          <div class="group relative inline-block">
            <div class="cursor-help text-gray-500 hover:text-gray-300">ℹ️</div>
            <div class="invisible group-hover:visible absolute z-10 w-48 p-2 mt-1 text-sm text-gray-300 bg-gray-800 rounded-lg shadow-lg border border-gray-700 -translate-x-1/2 left-1/2">
              The peak welfare capacity level
            </div>
          </div>
        </div>
        <select 
          class="w-full p-3 border rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors text-gray-300"
          bind:value={scenario.maxAltitude.type}
        >
          <option value="low">📊 Low (~10B human equivalent)</option>
          <option value="high">📈 High (100B+ human equivalent)</option>
        </select>
      </div>

      <!-- Progression Type -->
      <div class="parameter-group mt-6">
        <div class="flex items-center gap-2 mb-2">
          <h3 class="font-medium text-gray-300">Progression Style</h3>
          <div class="group relative inline-block">
            <div class="cursor-help text-gray-500 hover:text-gray-300">ℹ️</div>
            <div class="invisible group-hover:visible absolute z-10 w-48 p-2 mt-1 text-sm text-gray-300 bg-gray-800 rounded-lg shadow-lg border border-gray-700 -translate-x-1/2 left-1/2">
              How smooth is the growth?
            </div>
          </div>
        </div>
        <select 
          class="w-full p-3 border rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors text-gray-300"
          bind:value={scenario.progression.type}
        >
          <option value="gradual">📉 Gradual</option>
          <option value="discontinuous">📊 Discontinuous</option>
        </select>
      </div>

      <!-- Distribution -->
      <div class="parameter-group mt-6">
        <div class="flex items-center gap-2 mb-2">
          <h3 class="font-medium text-gray-300">Population Distribution</h3>
          <div class="group relative inline-block">
            <div class="cursor-help text-gray-500 hover:text-gray-300">ℹ️</div>
            <div class="invisible group-hover:visible absolute z-10 w-48 p-2 mt-1 text-sm text-gray-300 bg-gray-800 rounded-lg shadow-lg border border-gray-700 -translate-x-1/2 left-1/2">
              How are different digital mind populations distributed?
            </div>
          </div>
        </div>
        <select 
          class="w-full p-3 border rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors text-gray-300"
          bind:value={scenario.distribution.type}
        >
          <option value="uniform">🎯 Uniform</option>
          <option value="disuniform">🎲 Disuniform</option>
        </select>
      </div>

      <!-- Advanced Parameters -->
      <div class="mt-12">
        <h3 class="text-lg font-semibold mb-6 text-gray-100 border-b border-gray-700 pb-4">
          Advanced Considerations
        </h3>
        
        <!-- Existential Security -->
        <div class="parameter-group mt-4">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="font-medium text-gray-300">Existential Security</h3>
            <div class="group relative inline-block">
              <div class="cursor-help text-gray-500 hover:text-gray-300">ℹ️</div>
              <div class="invisible group-hover:visible absolute z-10 w-48 p-2 mt-1 text-sm text-gray-300 bg-gray-800 rounded-lg shadow-lg border border-gray-700 -translate-x-1/2 left-1/2">
                Is humanity secure from existential risks?
              </div>
            </div>
          </div>
          <select 
            class="w-full p-3 border rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors text-gray-300"
            bind:value={scenario.timing.existentialSecurityAligned}
          >
            <option value={false}>⚠️ Pre-Security</option>
            <option value={true}>🛡️ Post-Security</option>
          </select>
        </div>

        <!-- Launch Height -->
        <div class="parameter-group mt-4">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="font-medium text-gray-300">Launch Height</h3>
            <div class="group relative inline-block">
              <div class="cursor-help text-gray-500 hover:text-gray-300">ℹ️</div>
              <div class="invisible group-hover:visible absolute z-10 w-48 p-2 mt-1 text-sm text-gray-300 bg-gray-800 rounded-lg shadow-lg border border-gray-700 -translate-x-1/2 left-1/2">
                Initial welfare capacity level
              </div>
            </div>
          </div>
          <select 
            class="w-full p-3 border rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors text-gray-300"
            bind:value={scenario.launchHeight.type}
          >
            <option value="low">🌱 Low Launch</option>
            <option value="high">🚀 High Launch</option>
          </select>
        </div>

        <!-- Moral Consideration -->
        <div class="parameter-group mt-4">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="font-medium text-gray-300">Moral Consideration</h3>
            <div class="group relative inline-block">
              <div class="cursor-help text-gray-500 hover:text-gray-300">ℹ️</div>
              <div class="invisible group-hover:visible absolute z-10 w-48 p-2 mt-1 text-sm text-gray-300 bg-gray-800 rounded-lg shadow-lg border border-gray-700 -translate-x-1/2 left-1/2">
                How does moral consideration evolve with welfare capacity?
              </div>
            </div>
          </div>
          <select 
            class="w-full p-3 border rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors text-gray-300 mb-2"
            bind:value={scenario.moralConsideration.type}
          >
            <option value="coupled">🤝 Coupled</option>
            <option value="uncoupled">↔️ Uncoupled</option>
            <option value="decoupling">📉 Decoupling</option>
            <option value="delayed">⏳ Delayed</option>
          </select>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1"
            class="w-full accent-primary"
            bind:value={scenario.moralConsideration.level}
          >
          <div class="text-sm text-gray-300 font-mono">Level: {scenario.moralConsideration.level.toFixed(1)}</div>
        </div>
      </div>
    </div>

    <!-- Main content: Graph -->
    <div class="md:col-span-2">
      <div class="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-xl shadow-lg border border-gray-700">
        <div class="mb-6">
          <h3 class="text-xl font-medium text-gray-100 mb-2">
            {scenario.speed.type === 'fast' ? 'Fast' : 'Slow'} 
            {scenario.progression.type === 'gradual' ? 'Gradual' : 'Discontinuous'} Takeoff
          </h3>
          <p class="text-gray-400 text-sm">
            Visualizing how digital minds might develop under these conditions
          </p>
        </div>
        <div bind:this={graphContainer} class="w-full h-[400px] bg-gray-900 rounded-lg p-4"></div>
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) {
    background-color: #111827; /* gray-900 */
    background-image: radial-gradient(#374151 0.5px, transparent 0.5px);
    background-size: 15px 15px;
  }
  
  :global(.tick text) {
    font-family: system-ui, -apple-system, sans-serif;
    fill: #9ca3af; /* gray-400 */
  }

  .parameter-group {
    @apply mb-8 transition-all duration-200 ease-in-out;
  }

  .parameter-group:hover {
    @apply transform translate-x-1;
  }

  /* Custom range input styling */
  input[type="range"] {
    @apply h-2 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500;
  }

  input[type="range"]::-webkit-slider-thumb {
    @apply appearance-none w-4 h-4 rounded-full bg-gray-900 shadow-lg border-2 border-purple-400;
  }

  select {
    @apply border-gray-700 bg-gray-900 text-gray-300;
  }

  select:focus {
    @apply border-purple-500;
  }

  /* Update graph colors */
  :global(.grid line) {
    stroke: #374151; /* gray-700 */
  }

  :global(.domain) {
    stroke: #4b5563; /* gray-600 */
  }

  :global(.tick line) {
    stroke: #374151; /* gray-700 */
  }
</style>
