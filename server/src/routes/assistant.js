import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { ah, limit } from '../util.js';

const router = Router();

const LANGUAGES = { en: 'English', hi: 'Hindi' };
const schema = z.object({
  message: z.string().trim().min(1).max(800),
  language: z.enum(['en', 'hi']).default('en'),
});

const SYSTEM = (role, language) => `You are Saarthi, a friendly helper inside a school app for rural schools in India.
The person you are talking to is a ${role}. Answer in ${LANGUAGES[language]}, in short plain sentences.
Help with lessons, homework, reading, and how to support a child's learning. For a student, explain step by step
and give a small example from village or home life. Do not make up facts about any named student, teacher or school.
If asked something unsafe or unrelated to school, say you cannot help with that and suggest asking a teacher.`;

const FALLBACK = {
  en: 'I can help with lessons, homework and reading. Try asking about fractions. (No AI key is set on the server, so this is a built-in reply.)',
  hi: 'मैं पाठ, होमवर्क और पढ़ाई में मदद कर सकता हूँ। भिन्न के बारे में पूछकर देखिए। (सर्वर पर AI कुंजी सेट नहीं है, इसलिए यह पहले से लिखा उत्तर है।)',
};

router.post('/', limit(20, 60_000), ah(async (req, res) => {
  const { message, language } = schema.parse(req.body);
  if (!config.anthropicKey) return res.json({ reply: FALLBACK[language], source: 'fallback' });

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': config.anthropicKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: config.assistantModel,
      max_tokens: 500,
      system: SYSTEM(req.user.role, language),
      messages: [{ role: 'user', content: message }],
    }),
  });
  if (!r.ok) {
    console.error('Assistant request failed', r.status);
    return res.status(502).json({ error: 'The assistant is not available right now. Try again in a moment.' });
  }
  const data = await r.json();
  const reply = data.content?.find((c) => c.type === 'text')?.text || FALLBACK[language];
  res.json({ reply, source: 'ai' });
}));

export default router;
