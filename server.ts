import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import { Mistral } from '@mistralai/mistralai';

const PORT = Number(process.env.PORT ?? 3000);
const MODEL = 'mistral-small-latest';
const MAX_MESSAGES = 20;

if (!process.env.MISTRAL_API_KEY) {
  console.error('Missing MISTRAL_API_KEY. Copy .env.example to .env and set your key, or export it.');
  process.exit(1);
}

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const app = express();
app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.resolve(process.cwd(), 'public')));

app.post('/api/chat', async (req, res) => {
  const raw = req.body?.messages;
  if (!Array.isArray(raw) || raw.length === 0) {
    res.status(400).json({ error: 'body.messages must be a non-empty array' });
    return;
  }

  const messages: ChatMessage[] = raw
    .filter(
      (m): m is { role: 'user' | 'assistant'; content: string } =>
        !!m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content }));

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    res.status(400).json({ error: 'the last message must come from the user' });
    return;
  }

  try {
    const completion = await client.chat.complete({ model: MODEL, messages });
    const content = completion.choices?.[0]?.message?.content;
    const reply =
      typeof content === 'string'
        ? content
        : (content ?? [])
            .map((chunk) => ('text' in chunk ? chunk.text : ''))
            .join('');
    res.json({ reply });
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 401) {
      console.error('Mistral API rejected the key (401). Check MISTRAL_API_KEY in .env (single line, no spaces) and restart the server.');
    } else {
      console.error('Mistral API error:', err);
    }
    res.status(502).json({ error: 'the Mistral API request failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Chat app running at http://localhost:${PORT}`);
});
