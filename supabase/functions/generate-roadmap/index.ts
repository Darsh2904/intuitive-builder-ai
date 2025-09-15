import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { targetRole, currentSkills, difficultyLevel, duration } = await req.json();

    console.log('Generating roadmap for:', { targetRole, currentSkills, difficultyLevel, duration });

    const prompt = `Create a detailed placement preparation roadmap for someone wanting to become a ${targetRole}.

Current Skills: ${currentSkills}
Difficulty Level: ${difficultyLevel}
Duration: ${duration} weeks

Please provide:
1. A compelling title for the roadmap
2. A detailed description (2-3 paragraphs) explaining what this roadmap covers and the expected outcomes
3. Key skills they need to learn
4. Study milestones and timeline

Focus on practical skills, technical concepts, and interview preparation specifically for ${targetRole} positions.

Format your response as JSON with the following structure:
{
  "title": "Roadmap title here",
  "description": "Detailed description here",
  "skills": ["skill1", "skill2", "skill3"],
  "milestones": [
    {
      "id": "milestone1",
      "title": "Milestone title",
      "description": "What to accomplish",
      "week": 1,
      "tasks": ["task1", "task2"]
    }
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career coach and placement preparation specialist. Create detailed, practical roadmaps for students preparing for job placements. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const generatedContent = data.choices[0].message.content;
    console.log('Generated content:', generatedContent);

    // Parse the JSON response from GPT
    let roadmapData;
    try {
      roadmapData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse GPT response as JSON:', parseError);
      // Fallback roadmap if JSON parsing fails
      roadmapData = {
        title: `${targetRole} Placement Preparation Roadmap`,
        description: `A comprehensive ${duration}-week preparation plan for ${targetRole} positions, covering essential technical skills, interview preparation, and practical projects based on your current experience: ${currentSkills}`,
        skills: [],
        milestones: []
      };
    }

    console.log('Returning roadmap data:', roadmapData);

    return new Response(JSON.stringify(roadmapData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-roadmap function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate roadmap',
        details: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});