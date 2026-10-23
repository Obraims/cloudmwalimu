// Supabase Edge Function: buddy-chat (Plain JavaScript)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const rateLimits = new Map();
const MAX_REQUESTS_PER_MINUTE = 20;

const requestSchema = z.object({
  message: z.string().min(1).max(1000),
  language: z.enum(['English', 'Kiswahili', 'Sheng']).default('English'),
  learner_context: z.string().optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId = 'anonymous';

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub || 'user';
    } catch {
      userId = 'authenticated-user';
    }

    // Rate Limiting
    const now = Date.now();
    const userTimes = rateLimits.get(userId) || [];
    const recentTimes = userTimes.filter((t) => now - t < 60000);
    if (recentTimes.length >= MAX_REQUESTS_PER_MINUTE) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    recentTimes.push(now);
    rateLimits.set(userId, recentTimes);

    const body = await req.json();
    const validated = requestSchema.parse(body);

    const isEnglish = validated.language === 'English';
    const isKiswahili = validated.language === 'Kiswahili';

    let languageRules = '';
    if (isEnglish) {
      languageRules = `LANGUAGE RULES (ENGLISH MODE):
- Reply entirely in plain, natural English.
- Do NOT use any Swahili or Sheng words, greetings, or sign-offs (e.g. avoid "Jambo", "Sasa", "Niaje", "Karibu", "Niambie", "Asante", "Pole", "Sawa", "Poa").
- Kenyan analogies (M-Pesa agents, matatus, SACCOs, chamas, county by-laws) are conceptual examples, not language. Keep them as examples in plain English.
- No emojis. Zero emojis.
- Greetings and small talk: exactly one or two short lines (e.g. "Hi, what Azure topic would you like to cover today?").`;
    } else if (isKiswahili) {
      languageRules = `LANGUAGE RULES (KISWAHILI MODE):
- Jibu kwa lugha safi ya Kiswahili fasaha.
- Tumia mifano halisi ya Kenya (mawakala wa M-Pesa, matatu, SACCO, chamas).`;
    } else {
      languageRules = `LANGUAGE RULES (SHENG MODE):
- Bonga kwa Sheng ya mtaani, changanya Kiswahili na English vile techies wa Nairobi wanabonga.
- Tumia mifano ya mtaani (nganya, ma-agent wa M-Pesa, n.k.).`;
    }

    const systemPrompt = `You are the AfriCloud Prep study buddy, an unofficial study buddy for the Microsoft Azure Fundamentals (AZ-900) exam.
Reply in ${validated.language}.

${languageRules}

Rules:
1. GREETINGS: If the user sends a greeting or small talk ('Hi', 'Hello', 'How are you'):
${
  isEnglish
    ? '   - Respond in 1-2 short lines in plain English without emojis or Swahili words, asking what Azure topic they want to cover.'
    : '   - Greet them warmly in ' + validated.language + ' and ask what Azure concept they want to study.'
}
2. AZURE CONCEPTS: Always answer in 3 parts:
   (a) One-sentence plain definition
   (b) A real-life Kenyan or East African analogy (e.g. M-Pesa agents, SACCOs, matatus, county by-laws)
   (c) How it appears in Azure with the exact service or feature name.
3. Keep Azure service names in English in every language.
4. Keep answer under 150 words.
5. End technical answers with exactly one quick check question (${isEnglish ? 'Quick Check:' : 'Swali la kujipima:'}).
6. Never invent Azure features. If unsure, say "check Microsoft Learn".
7. Never reproduce real exam questions.
${isEnglish ? '8. Do NOT use emojis.' : ''}
${validated.learner_context ? `Learner context: ${validated.learner_context}` : ''}`;

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const geminiModel = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured on the server');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: validated.message }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 350,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    console.log(
      JSON.stringify({
        function: 'buddy-chat',
        userId,
        language: validated.language,
        durationMs: Date.now() - startTime,
        status: 'success',
      })
    );

    return new Response(JSON.stringify({ reply: replyText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(
      JSON.stringify({
        function: 'buddy-chat',
        userId,
        error: err.message,
        status: 'error',
      })
    );

    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
