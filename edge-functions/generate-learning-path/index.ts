// ═══════════════════════════════════════════════════════════════
//  generate-learning-path — AI Learning Path Generator
//  Creates personalized 4-module learning paths
//  Standards-mapped (CCSS, NGSS)
//  DEPLOY: Copy to supabase/functions/generate-learning-path/index.ts
// ═══════════════════════════════════════════════════════════════
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { callOpenAI, parseJSON } from '../_shared/openai.ts';

function buildFallbackModules(topic: string, studentName: string): any[] {
  return [
    {
      title: `The Untold Origin Story of ${topic}`,
      subject_display: 'History & Culture',
      subject_color: 'bg-amber-100 text-amber-700',
      subject_tags: ['History', 'Science'],
      time_estimate_minutes: 15,
      description: `${studentName}, ${topic} has a wilder backstory than you'd ever guess. Let's go back to where it all started.`,
      activity_type: 'explore',
    },
    {
      title: `The Hidden Forces Behind ${topic}`,
      subject_display: 'Hidden Physics',
      subject_color: 'bg-blue-100 text-blue-700',
      subject_tags: ['Science', 'Math'],
      time_estimate_minutes: 20,
      description: `There's invisible science happening every time you interact with ${topic}. Once you see it, you can't unsee it.`,
      activity_type: 'experiment',
    },
    {
      title: `The Numbers Nobody Notices`,
      subject_display: 'Real-World Math',
      subject_color: 'bg-purple-100 text-purple-700',
      subject_tags: ['Math', 'Science'],
      time_estimate_minutes: 15,
      description: `Math is hiding everywhere in ${topic} — and the people who notice it have a serious advantage.`,
      activity_type: 'explore',
    },
    {
      title: `Build Something Real`,
      subject_display: 'Design Lab',
      subject_color: 'bg-pink-100 text-pink-700',
      subject_tags: ['Engineering', 'Arts'],
      time_estimate_minutes: 20,
      description: `Time to take everything you've discovered and make something with it. This is where curiosity turns into creation.`,
      activity_type: 'create',
    },
  ];
}

serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const body = await req.json();
    const {
      topic,
      studentName = 'friend',
      age = 10,
      gradeLevel = '5',
      interests = [],
      learningStyle = 'visual',
      strengths = [],
      entrepreneurialInterest = false,
      handsOnPreference = false,
    } = body;

    if (!topic) {
      return new Response(JSON.stringify({ error: 'topic is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const firstName = studentName.split(' ')[0];
    const gradeBand = age <= 7 ? 'K-2' : age <= 10 ? '3-5' : age <= 13 ? '6-8' : '9-12';

    const prompt = `You are a curriculum designer for FreeLearner.ai. Create a personalized 4-module learning path for a student.

STUDENT:
- Name: ${firstName} (age ${age}, grade ${gradeLevel}, ${gradeBand})
- Interests: ${interests.join(', ') || 'general'}
- Learning style: ${learningStyle}
- Strengths: ${strengths.join(', ') || 'general'}
${entrepreneurialInterest ? '- Interested in entrepreneurship/business' : ''}
${handsOnPreference ? '- Prefers hands-on activities' : ''}

TOPIC: "${topic}"

RULES:
1. Each module should secretly teach real academic standards (CCSS, NGSS) through the lens of "${topic}"
2. Use ${firstName}'s name in descriptions (naturally, not every sentence)
3. Make titles intriguing — like YouTube video titles that make you NEED to click
4. Each module should feel like an adventure, not a textbook
5. Vary activity types: explore, experiment, create, challenge
6. Cover at least 3 different subject areas across the 4 modules
7. Descriptions should be 1-2 sentences that hook curiosity
8. Time estimates: 15-25 minutes each
9. Subject tags should be specific academic areas covered

Return JSON:
{
  "modules": [
    {
      "title": "string (intriguing, clickable title)",
      "subject_display": "string (e.g., 'Hidden Physics', 'Real-World Math', 'History Detective')",
      "subject_color": "string (Tailwind: 'bg-blue-100 text-blue-700')",
      "subject_tags": ["Math", "Science"],
      "time_estimate_minutes": 15,
      "description": "string (1-2 sentences, hooks curiosity, uses student name)",
      "activity_type": "explore|experiment|create|challenge"
    }
  ],
  "tomorrow_teaser": "string (1 sentence teaser for what comes next)",
  "path_summary": "string (1 sentence overview)"
}`;

    let modules: any[];
    let tomorrowTeaser = `Tomorrow we'll dive deeper into ${topic}...`;
    let pathSummary = `Exploring ${topic} today!`;

    try {
      const raw = await callOpenAI(
        [{ role: 'system', content: prompt }],
        { model: 'gpt-4o-mini', temperature: 0.8, max_tokens: 1200, response_format: { type: 'json_object' } },
      );
      const parsed = parseJSON(raw);
      modules = parsed.modules || buildFallbackModules(topic, firstName);
      tomorrowTeaser = parsed.tomorrow_teaser || tomorrowTeaser;
      pathSummary = parsed.path_summary || pathSummary;
    } catch (err) {
      console.error('Learning path AI failed, using fallback:', err);
      modules = buildFallbackModules(topic, firstName);
    }

    // Ensure valid color classes
    const validColors = [
      'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700',
      'bg-green-100 text-green-700', 'bg-amber-100 text-amber-700',
      'bg-pink-100 text-pink-700', 'bg-red-100 text-red-700',
      'bg-indigo-100 text-indigo-700', 'bg-teal-100 text-teal-700',
    ];
    modules = modules.map((m: any, i: number) => ({
      ...m,
      subject_color: validColors.includes(m.subject_color) ? m.subject_color : validColors[i % validColors.length],
      time_estimate_minutes: m.time_estimate_minutes || 15,
      activity_type: ['explore', 'experiment', 'create', 'challenge'].includes(m.activity_type) ? m.activity_type : 'explore',
      subject_tags: m.subject_tags || ['General'],
    }));

    return new Response(JSON.stringify({
      modules,
      tomorrow_teaser: tomorrowTeaser,
      path_summary: pathSummary,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('generate-learning-path error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
