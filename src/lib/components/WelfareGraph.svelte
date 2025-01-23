<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { scenario } from '$lib/stores/scenarioStore';
  import { generateCurveData, generateMoralConsiderationData } from '$lib/utils/graphCalculations';
  import { formatPowerOfTen, formatWelfareCapacity } from '$lib/utils/formatters';

  export let currentYear = 2025;
  
  let graphContainer;
  let svg;
  let width;
  let height = 400;
  let margin = { top: 20, right: 150, bottom: 30, left: 120 };
  
  const HUMAN_POPULATION_WELFARE = 8e9;

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

  // Initialize yScale with fixed domain using linear scale
  let yScale = d3.scaleLinear()  // Changed from scaleLog to scaleLinear
    .domain([0, 1e14])  // Start from 0 instead of 1e6
    .range([0, 100]);

  // Make yScale reactive to height and margin changes, but keep domain fixed
  $: if (height && margin) {
    const minY = Math.min(
      $scenario.expectedValue.initialCapacity,
      1e6 // Absolute minimum to show
    );
    
    const maxY = Math.max(
      $scenario.expectedValue.maxCapacity,
      HUMAN_POPULATION_WELFARE * 2 // At least show 2x human population
    );

    yScale = d3.scaleLinear()
      .domain([minY, maxY])
      .range([height - margin.bottom, margin.top]);
  }

  function updateMarker() {
    if (!svg || !xScale || !width) return;

    svg.selectAll('.current-year-marker').remove();
    
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

    const currentPoint = generateCurveData($scenario).find(d => Math.abs(d.x - currentYear) < 0.5);
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

  function updateGraph() {
    if (!graphContainer) return;

    d3.select(graphContainer).selectAll("*").remove();

    width = graphContainer.clientWidth;

    svg = d3.select(graphContainer)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('style', 'max-width: 100%; height: auto;');

    if (!width) return;

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale)
        .tickValues([2025, 2035, 2045, 2055, 2065, 2075, 2085])
        .tickFormat(d3.format('d')));

    // Add grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale)
        .tickValues([2025, 2035, 2045, 2055, 2065, 2075, 2085])
        .tickSize(-height + margin.top + margin.bottom)
        .tickFormat(''))
      .style('stroke-opacity', 0.2);

    // Y-axis with linear ticks
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale)
        .tickValues([0, 1e9, 2e9, 5e9, 1e10, 2e10, 5e10, 1e11, 2e11, 5e11, 1e12, 2e12, 5e12, 1e13, 2e13, 5e13, 1e14])
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

    const curveData = generateCurveData($scenario);
    
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

    // Add human population baseline
    svg.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', yScale(HUMAN_POPULATION_WELFARE))
      .attr('y2', yScale(HUMAN_POPULATION_WELFARE))
      .attr('stroke', '#fbbf24')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .attr('class', 'human-population-baseline');

    // Add label for human population line
    svg.append('text')
      .attr('x', margin.left - 10)
      .attr('y', yScale(HUMAN_POPULATION_WELFARE))
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#fbbf24')
      .attr('font-size', '12px')
      .text('~8B humans');

    // Add welfare capacity curve
    svg.append('path')
      .datum(curveData)
      .attr('fill', 'none')
      .attr('stroke', '#60a5fa')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add moral consideration line
    if ($scenario.moralConsideration.type !== 'uncoupled') {
      const moralConsiderationData = generateMoralConsiderationData($scenario);
      const lineWithGaps = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .defined(d => d.y >= 1e6)
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

    // Add human population reference to legend
    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 40)
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

    // Update styles
    svg.selectAll('.domain')
      .style('stroke', '#4b5563');
    
    svg.selectAll('.tick line')
      .style('stroke', '#374151');

    svg.selectAll('.tick text')
      .style('fill', '#9ca3af');

    svg.selectAll('text')
      .style('fill', '#9ca3af');

    // Update marker
    updateMarker();
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

  // Watch for scenario changes and currentYear changes
  $: $scenario, updateGraph();
  $: currentYear, updateMarker();
</script>

<div bind:this={graphContainer} class="w-full h-[400px] bg-gray-900 rounded-lg p-4"></div>

<style>
  :global(.tick text) {
    font-family: system-ui, -apple-system, sans-serif;
    fill: #9ca3af;
  }
</style> 