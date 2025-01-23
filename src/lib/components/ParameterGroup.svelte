<script>
  export let label;
  export let tooltip;
</script>

<div class="parameter-group">
  <div class="flex items-center gap-2 mb-2">
    <h3 class="font-medium text-gray-300">{label}</h3>
    <div class="group relative inline-block">
      <div class="cursor-help text-gray-500 hover:text-gray-300 text-sm">(what's this?)</div>
      <div class="invisible group-hover:visible absolute z-10 w-64 p-3 mt-1 text-sm leading-relaxed text-gray-300 bg-gray-800 rounded-xl shadow-xl border border-gray-700 -translate-x-1/2 left-1/2">
        <span class="block font-medium mb-1">{label}</span>
        {tooltip}
      </div>
    </div>
  </div>
  <div class="relative">
    <slot></slot>
  </div>
</div>

<style>
  .parameter-group {
    @apply mb-8 transition-all duration-200 ease-in-out;
  }

  .parameter-group:hover {
    @apply transform translate-x-1;
  }
</style> 