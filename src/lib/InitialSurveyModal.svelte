<script>
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  const dispatch = createEventDispatcher();

  let currentQuestion = 0;
  let answers = {
    startYear: 2025,
    credence: 50, // Individual credence about consciousness
    initialCapacity: 1e6,
    maxCapacity: 1e12,
    takeoffSpeed: null,
    riskLevel: null,
    moralProgress: null, // Keep tracking societal moral progress
    progressionType: null,
    initialCapacityLog: 6, // 10^6 = 1 million
    maxCapacityLog: 12    // 10^12 = 1 trillion
  };

  const questions = [
    {
      id: 'credence',
      text: 'What is your credence (0-100%) that digital systems could be conscious/moral patients?',
      type: 'credence-select',
      description: 'This represents your confidence that digital minds could have morally relevant experiences'
    },
    {
      id: 'startYear',
      text: 'Assuming that digital sentience is possible, when do you expect the first sentient digital minds to be created?',
      type: 'year-select',
      description: 'This represents when digital minds with potential moral status might first emerge'
    },
    {
      id: 'capacity',
      text: 'What scale of welfare capacity do you expect?',
      type: 'capacity-select',
      title: 'What scale of welfare capacity do you expect?',
      subtitle: 'Expected welfare capacity relative to a typical human (1 = one human-equivalent)',
      options: {
        initialCapacity: [
          { value: 1e4, label: '10,000' },
          { value: 1e6, label: '1 million' },
          { value: 1e8, label: '100 million' }
        ],
        maxCapacity: [
          { value: 1e12, label: '1 trillion' },
          { value: 1e13, label: '10 trillion' },
          { value: 1e14, label: '100 trillion' }
        ]
      }
    },
    {
      id: 'takeoffSpeed',
      text: 'How quickly do you expect digital mind welfare capacity to develop?',
      options: [
        { 
          value: 'slow', 
          label: 'Slow Takeoff (Months)', 
          description: 'Development over several months with some time for adaptation'
        },
        { 
          value: 'moderate', 
          label: 'Moderate Takeoff (Weeks)',
          description: 'Rapid progress over weeks with limited adjustment time'
        },
        { 
          value: 'fast', 
          label: 'Fast Takeoff (Days)', 
          description: 'Extremely rapid acceleration over days'
        }
      ]
    },
    {
      id: 'moralProgress',
      text: 'How do you expect society\'s moral consideration of digital minds to develop?',
      options: [
        { 
          value: 'early', 
          label: 'Early Recognition', 
          description: 'Society establishes moral status before widespread deployment'
        },
        { 
          value: 'gradual', 
          label: 'Gradual Recognition',
          description: 'Growing societal awareness as capabilities increase'
        },
        { 
          value: 'late', 
          label: 'Delayed Recognition', 
          description: 'Significant societal lag in moral consideration'
        }
      ]
    },
    {
      id: 'riskLevel',
      text: 'What level of existential risk do you expect during this development?',
      options: [
        { 
          value: 'low', 
          label: 'Low Risk', 
          description: 'Strong safety measures and alignment in place'
        },
        { 
          value: 'medium', 
          label: 'Medium Risk',
          description: 'Some safety measures but significant uncertainty'
        },
        { 
          value: 'high', 
          label: 'High Risk', 
          description: 'Limited safety assurance or alignment confidence'
        }
      ]
    },
    {
      id: 'progressionType',
      text: 'How do you expect the development of digital minds to progress?',
      options: [
        { 
          value: 'gradual', 
          label: 'Gradual Development', 
          description: 'Steady, continuous progress with predictable stages'
        },
        { 
          value: 'discontinuous', 
          label: 'Discontinuous Development',
          description: 'Development characterized by sudden jumps and breakthroughs'
        }
      ]
    }
  ];

  function handleCredenceSelect() {
    if (answers.credence >= 0 && answers.credence <= 100) {
      currentQuestion++;
    }
  }

  function handleYearSelect() {
    currentQuestion++;
  }

  function handleCapacitySelect(initial, maximum) {
    answers.initialCapacity = initial;
    answers.maxCapacity = maximum;
    currentQuestion++;
  }

  function handleAnswer(value) {
    answers[questions[currentQuestion].id] = value;
    
    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
    } else {
      generateScenario();
    }
  }

  function generateScenario() {
    console.log('Generating scenario from answers:', answers);
    const scenario = {
      speed: {
        type: answers.takeoffSpeed 
      },
      timing: {
        startYear: answers.startYear,
        existentialSecurityAligned: answers.riskLevel === 'low'
      },
      maxAltitude: {
        type: answers.maxCapacity >= 1e13 ? 'high' : 'low'  // Updated threshold
      },
      launchHeight: {
        type: answers.initialCapacity >= 1e7 ? 'high' : 'low'
      },
      progression: {
        type: answers.progressionType
      },
      moralConsideration: {
        type: answers.moralProgress === 'early' ? 'coupled' :
              answers.moralProgress === 'gradual' ? 'delayed' : 'decoupling',
        level: answers.moralProgress === 'early' ? 0.8 :
               answers.moralProgress === 'gradual' ? 0.5 : 0.3
      },
      expectedValue: {
        credence: answers.credence,
        initialCapacity: answers.initialCapacity,
        maxCapacity: answers.maxCapacity
      }
    };

    console.log('Dispatching complete event with scenario:', scenario);
    dispatch('complete', scenario);
  }

  function formatNumber(num) {
    if (num >= 1e12) return `${(num/1e12).toFixed(0)}T`;
    if (num >= 1e9) return `${(num/1e9).toFixed(0)}B`;
    if (num >= 1e6) return `${(num/1e6).toFixed(0)}M`;
    if (num >= 1e3) return `${(num/1e3).toFixed(0)}k`;
    return num.toString();
  }
</script>

<div 
  class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50"
  transition:fade
>
  <div class="bg-gray-800 rounded-xl p-8 max-w-2xl w-full mx-4 shadow-2xl border border-gray-700">
    <div class="mb-8">
      <div class="text-sm text-gray-400 mb-2">
        Question {currentQuestion + 1} of {questions.length}
      </div>
      <div class="w-full bg-gray-700 h-1 rounded-full">
        <div 
          class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-1 rounded-full transition-all duration-300"
          style="width: {((currentQuestion + 1) / questions.length) * 100}%"
        ></div>
      </div>
    </div>

    <h3 class="text-xl font-medium mb-6 text-gray-100">
      {questions[currentQuestion].text}
    </h3>

    {#if questions[currentQuestion].type === 'credence-select'}
      <div class="space-y-4">
        <p class="text-gray-400 text-sm mb-4">{questions[currentQuestion].description}</p>
        <div class="flex flex-col gap-4">
          <input 
            type="range" 
            min="0" 
            max="100" 
            bind:value={answers.credence}
            class="w-full accent-purple-500"
          />
          <div class="flex justify-between items-center">
            <span class="text-gray-400 text-sm">0%</span>
            <span class="text-gray-100 font-mono text-lg">{answers.credence}%</span>
            <span class="text-gray-400 text-sm">100%</span>
          </div>
          <button
            class="w-full p-4 text-center rounded-lg border border-gray-700 hover:border-purple-500 
                   bg-gray-900 hover:bg-gray-800 transition-all duration-200 text-gray-100"
            on:click={handleCredenceSelect}
          >
            Continue
          </button>
        </div>
      </div>
    {:else if questions[currentQuestion].type === 'year-select'}
      <div class="space-y-4">
        <p class="text-gray-400 text-sm mb-4">{questions[currentQuestion].description}</p>
        <div class="flex flex-col gap-4">
          <input 
            type="range" 
            min="2025" 
            max="2075" 
            bind:value={answers.startYear}
            class="w-full accent-purple-500"
          />
          <div class="flex justify-between items-center">
            <span class="text-gray-400 text-sm">2025</span>
            <span class="text-gray-100 font-mono text-lg">{answers.startYear}</span>
            <span class="text-gray-400 text-sm">2075</span>
          </div>
          <button
            class="w-full p-4 text-center rounded-lg border border-gray-700 hover:border-purple-500 
                   bg-gray-900 hover:bg-gray-800 transition-all duration-200 text-gray-100"
            on:click={handleYearSelect}
          >
            Continue
          </button>
        </div>
      </div>
    {:else if questions[currentQuestion].type === 'capacity-select'}
      <div class="space-y-6">
        <p class="text-gray-400 text-sm mb-4">{questions[currentQuestion].subtitle}</p>
        
        <!-- Initial Capacity Slider -->
        <div>
          <h4 class="text-gray-200 mb-2">Initial Capacity (human-equivalents):</h4>
          <input 
            type="range" 
            min="4"
            max="8"
            step="0.1"
            class="w-full accent-purple-500"
            bind:value={answers.initialCapacityLog}
            on:input={() => answers.initialCapacity = Math.pow(10, answers.initialCapacityLog)}
          />
          <div class="flex justify-between items-center mt-2">
            <span class="text-gray-400 text-sm">10k</span>
            <span class="text-gray-100 font-mono text-lg">
              {formatNumber(answers.initialCapacity)}
            </span>
            <span class="text-gray-400 text-sm">100M</span>
          </div>
        </div>

        <!-- Maximum Capacity Slider -->
        <div>
          <h4 class="text-gray-200 mb-2">Maximum Capacity:</h4>
          <input 
            type="range" 
            min="9"
            max="14"
            step="0.1"
            class="w-full accent-purple-500"
            bind:value={answers.maxCapacityLog}
            on:input={() => answers.maxCapacity = Math.pow(10, answers.maxCapacityLog)}
          />
          <div class="flex justify-between items-center mt-2">
            <span class="text-gray-400 text-sm">1B</span>
            <span class="text-gray-100 font-mono text-lg">
              {formatNumber(answers.maxCapacity)}
            </span>
            <span class="text-gray-400 text-sm">100T</span>
          </div>
        </div>

        <button
          class="w-full p-4 text-center rounded-lg border border-gray-700 hover:border-purple-500 
                 bg-gray-900 hover:bg-gray-800 transition-all duration-200 text-gray-100"
          on:click={() => currentQuestion++}
          disabled={!answers.initialCapacity || !answers.maxCapacity}
        >
          Continue
        </button>
      </div>
    {:else}
      <div class="space-y-4">
        {#each questions[currentQuestion].options as option}
          <button
            class="w-full p-4 text-left rounded-lg border border-gray-700 hover:border-purple-500 
                   bg-gray-900 hover:bg-gray-800 transition-all duration-200"
            on:click={() => handleAnswer(option.value)}
          >
            <div class="font-medium text-gray-100 mb-1">{option.label}</div>
            <div class="text-sm text-gray-400">{option.description}</div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  input[type="range"] {
    @apply h-2 rounded-full appearance-none cursor-pointer bg-gray-700;
  }

  input[type="range"]::-webkit-slider-thumb {
    @apply appearance-none w-4 h-4 rounded-full bg-purple-500 cursor-pointer;
  }
</style> 