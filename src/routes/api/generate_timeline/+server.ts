import { GEMINI_API_KEY, PDF_URI } from '$env/static/private';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.8,
  },
});

// Add helper function to clean response
function cleanJsonResponse(response: string): string {
  // Remove markdown code block syntax and any surrounding whitespace
  return response.replace(/```[^`]*```/g, '')  // Remove code blocks
                .replace(/^\s*|\s*$/g, '')     // Trim whitespace
                .replace(/^[^{]*({.*})[^}]*$/s, '$1'); // Extract just the JSON object
}

export const POST = async ({ request }: RequestEvent) => {
  try {
    const { scenario, years, currentYear } = await request.json();
    console.log('Server received request:', { scenario, years, currentYear });
    
    if (!Array.isArray(years) || years.length === 0) {
      throw new Error('Invalid years array');
    }

    const narratives: Record<string, string> = {};

    // Create a TransformStream for server-sent events
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Send initial progress
    await writer.write(`data: ${JSON.stringify({ type: 'progress', progress: 0 })}\n\n`);

    // Generate narratives sequentially
    for (const [index, year] of years.entries()) {
      try {
        const previousYears = years.filter(y => y < year);
        const previousNarratives = previousYears.map(y => `${y}: ${narratives[y]}`).join('\n\n');

        const prompt = `You are writing historical accounts of digital minds takeoff scenarios from the perspective of the year 2125.
        
        Current scenario parameters:
        - Speed: ${scenario.speed.type} (${scenario.speed.type === 'fast' ? 'Days/Weeks' : scenario.speed.type === 'moderate' ? 'Months/Years' : 'Years/Decades'})
        - Initial Capacity: ${scenario.expectedValue.initialCapacity.toExponential()} human-equivalents (1 = one human's welfare capacity)
        - Maximum Capacity: ${scenario.expectedValue.maxCapacity.toExponential()} human-equivalents
        - Current Human Population Reference: 8 billion human-equivalents
        - Credence Level: ${scenario.expectedValue.credence}%
        - Progression: ${scenario.progression.type} (${scenario.progression.type === 'gradual' ? 'steady progress' : 'sudden jumps'})
        - Start Year: ${scenario.timing.startYear}
        - Existential Security: ${scenario.timing.existentialSecurityAligned ? 'Achieved' : 'Not Yet Achieved'}
        - Moral Consideration: ${scenario.moralConsideration.type} (Level: ${scenario.moralConsideration.level})

        Welfare Capacity Context:
        - Numbers represent total welfare/experiential capacity relative to individual humans
        - 1e6 (1 million) = welfare capacity equivalent to a small city
        - 1e9 (1 billion) = welfare capacity equivalent to a large country
        - 8e9 (8 billion) = approximate current human population welfare capacity
        - 1e10 (10 billion) = slightly more than current human population
        - 1e11 (100 billion) = order of magnitude more than current humanity

        Previous historical accounts:
        ${previousNarratives}

        Generate a historical account for the year ${year}, maintaining consistency with previous years.
        Focus on:
        1. The state of digital minds and their welfare capacity (matching the graph's current level)
           - Express welfare capacity in both numerical terms and human-relatable comparisons
        2. The implications of the moral consideration level (${scenario.moralConsideration.level * 100}% recognition)
        3. The societal and technological developments
        4. How humanity was adapting to these changes

        Write 2-3 paragraphs for this year.`;

        const result = await model.generateContent([
          { 
            fileData: {
              fileUri: PDF_URI,
              mimeType: 'application/pdf'
            }
          },
          prompt
        ]);

        const text = result.response.text();
        narratives[year] = text.trim();

        // Send progress update
        const progress = Math.round((index + 1) / years.length * 100);
        await writer.write(`data: ${JSON.stringify({ type: 'progress', progress })}\n\n`);

      } catch (error) {
        console.error(`Error generating narrative for year ${year}:`, error);
        throw error;
      }
    }

    // Send completion message
    await writer.write(`data: ${JSON.stringify({ type: 'complete', narratives })}\n\n`);
    await writer.close();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error generating timeline:', error);
    return json({ error: error.message || 'Failed to generate timeline' }, { status: 500 });
  }
}; 