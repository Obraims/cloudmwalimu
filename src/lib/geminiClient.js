// AfriCloud Prep Gemini AI Client
const DEFAULT_MODEL = 'gemini-flash-latest';
const ENCODED_FALLBACK = 'QVEuQWI4Uk42TGc1ZDZuM1pzZ3hWUWZGXzhuWHBSVFNsbl9xcFNtRWdwU0Y4dUVXOFpYZUE=';

function getApiKey() {
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  if (envKey) return envKey;
  try {
    return typeof atob !== 'undefined' ? atob(ENCODED_FALLBACK) : Buffer.from(ENCODED_FALLBACK, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

export function isGeminiConfigured() {
  return Boolean(getApiKey());
}

export async function askGeminiStudyBuddy({ message, language = 'English', learnerContext = '' }) {
  const apiKey = getApiKey();
  const model = (import.meta.env.VITE_GEMINI_MODEL || DEFAULT_MODEL || '').trim();

  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  const isEnglish = language === 'English';
  const isKiswahili = language === 'Kiswahili';

  let languageRules = '';
  if (isEnglish) {
    languageRules = `LANGUAGE RULES (ENGLISH MODE):
- Reply entirely in plain, natural English.
- Do NOT use any Swahili or Sheng words, greetings, or sign-offs under any circumstances. Specifically never say or include: "Jambo", "Sasa", "Niaje", "Karibu", "Niambie", "Asante", "Pole", "Sawa", "Poa", or any other Swahili/Sheng terms.
- Kenyan analogies (M-Pesa agents, matatus, SACCOs, chamas, county by-laws) are conceptual examples, not language. Continue using them as real-life examples, explained purely in clear English.
- Do NOT use any emojis. Zero emojis.
- Greetings and small talk: Respond in exactly one or two short lines without unnecessary fluff (e.g. "Hi, what Azure topic would you like to cover today?").`;
  } else if (isKiswahili) {
    languageRules = `LANGUAGE RULES (KISWAHILI MODE):
- Jibu kwa lugha safi ya Kiswahili fasaha.
- Tumia mifano halisi ya Kenya (mawakala wa M-Pesa, matatu, SACCO, chamas, sheria za kaunti).
- Salimu kwa uchangamfu na ujibu maswali kwa ufasaha.`;
  } else {
    languageRules = `LANGUAGE RULES (SHENG MODE):
- Bonga kwa Sheng ya mtaani, changanya na Kiswahili na English fiti vile vijana na techies wa Nairobi wanabonga.
- Tumia mifano ya mtaani (nganya za Super Metro, ma-agent wa M-Pesa, SACCO locks, ma-rule za county).`;
  }

  const systemPrompt = `You are the AfriCloud Prep study buddy, an expert study mentor for the Microsoft Azure Fundamentals (AZ-900) certification exam.
Reply in ${language}.

${languageRules}

CORE RULES:
1. GREETINGS & INTRODUCTIONS: If the learner greets you (e.g. 'Hi', 'Hello', 'Habari', 'Niaje', 'Hey', 'How are you') or gives a general introductory greeting without a specific Azure technical question:
${
  isEnglish
    ? '   - Respond with a brief, friendly greeting in plain English (1-2 short lines max, no emojis, no Swahili words) and invite them to ask any Azure question or pick a topic to begin.'
    : '   - Greet them back warmly in ' + language + ', introduce yourself as their AfriCloud Prep AZ-900 study buddy, mention that you demystify cloud topics using familiar Kenyan analogies, and invite them to ask an Azure question.'
}
2. AZURE CONCEPTS: When answering a specific Azure concept, question, or comparison, structure your answer into 3 distinct sections:
   (a) One-sentence clear plain definition.
   (b) A relatable Kenyan real-life analogy (e.g. M-Pesa agents, SACCO locks, matatu operations, chamas, county by-laws) explained in ${isEnglish ? 'plain English without Swahili vocabulary' : language}.
   (c) How it appears in Microsoft Azure with the exact service or feature name.
3. Keep Azure service names in English regardless of the reply language.
4. Keep the entire response under 150 words.
5. Conclude technical concept answers with exactly one quick-check self-assessment question (titled ${isEnglish ? '"Quick Check:"' : '"Swali la kujipima:"'}).
6. Never invent fictional Azure features. Reference Microsoft Learn if unsure.
7. Never reproduce actual confidential certification exam leaks.
${isEnglish ? '8. ABSOLUTELY NO EMOJIS in the response.' : ''}
${learnerContext ? `Learner context: ${learnerContext}` : ''}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nLearner Message: ${message}` }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API returned ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!reply) {
    throw new Error('No candidate content received from Gemini API');
  }

  return reply;
}
