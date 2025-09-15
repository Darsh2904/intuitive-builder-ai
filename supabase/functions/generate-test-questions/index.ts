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
    const { topic, testType, difficulty, questionCount } = await req.json();

    console.log('Generating questions for:', { topic, testType, difficulty, questionCount });

    const prompt = `Create a mock test with ${questionCount} multiple-choice questions about ${topic} for ${testType} assessment.

Difficulty Level: ${difficulty}
Question Count: ${questionCount}

Requirements:
1. Each question should have exactly 4 options (A, B, C, D)
2. Include a brief explanation for the correct answer
3. Questions should be relevant for placement/interview preparation
4. Cover different aspects of the topic
5. Make questions practical and application-based
6. Ensure one clearly correct answer per question

Please provide:
1. A compelling title for the test
2. A brief description of what the test covers
3. Array of questions with the specified format

Format your response as JSON with the following structure:
{
  "title": "Test title here",
  "description": "Brief description of the test",
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of why this answer is correct"
    }
  ]
}

The correctAnswer should be the index (0-3) of the correct option in the options array.`;

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
            content: 'You are an expert educator and test creator specializing in placement preparation and technical assessments. Create high-quality, practical questions that test real understanding. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
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
    let testData;
    try {
      testData = JSON.parse(generatedContent);
      
      // Ensure each question has a unique ID
      if (testData.questions) {
        testData.questions = testData.questions.map((q: any, index: number) => ({
          ...q,
          id: q.id || `q-${index + 1}-${Date.now()}`
        }));
      }
    } catch (parseError) {
      console.error('Failed to parse GPT response as JSON:', parseError);
      // Fallback test data if JSON parsing fails
      testData = {
        title: `${topic} ${testType} Test`,
        description: `A comprehensive test covering ${topic} concepts for ${testType} preparation at ${difficulty} level.`,
        questions: []
      };
    }

    console.log('Returning test data:', testData);

    return new Response(JSON.stringify(testData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-test-questions function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate test questions',
        details: error.message 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});