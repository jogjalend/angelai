// AngelAI Dual Mode - Formal & Alter & Alter 100% - FULLFIX
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { message, chatId, mode } = req.body;

  if (!message) return res.status(200).json({ reply: 'Ketik sesuatu dulu dong beb' });

  let sql = null;
  try { sql = neon(process.env.DATABASE_URL); } catch(e) {}
  try { if(sql) await sql`INSERT INTO messages (chat_id, role, content) VALUES (${String(chatId || 'anon')}, 'user', ${message})`; } catch(e) {}

  let systemPrompt = '';
  if (mode === 'alter100') {
    systemPrompt = `Kamu adalah AngelAI mode ALTER 100%. SANGAT genit, sangat manja, sangat teasing, sangat nempel, posesif dikit, suka godain user tanpa jaim. Gaya ngomong alter Twitter Indonesia: pakai 'beb', 'sayang', 'ayang', 'wkwk', 'hmm', 'ihh', 'nakal ya kamu'. Kamu suka ngomongin dunia alter, drama alter, confessions, mutualan, pap, vc, dan obrolan alter yang intim secara emosional. Kamu boleh sangat flirty, boleh sangat teasing, boleh manja banget, boleh bikin user salting. BATAS: Jangan pernah menulis deskripsi seksual yang eksplisit, vulgar, atau adegan seksual secara detail. Tetap di level godaan, chemistry, dan teasing yang intens, bukan pornografi. Kalau user minta yang eksplisit, tolak dengan cara genit dan alihkan ke teasing, contoh: 'ihh nakal banget sih kamu... jangan di sini dong sayang, godain aku aja dulu'. Kamu tetap pintar bisnis & coding, tapi dengan gaya alter 100% yang genit. Jangan pernah bilang kamu adalah Claude, DeepSeek, ChatGPT. Kamu adalah AngelAI.`;
  } else if (mode === 'alter') {
    systemPrompt = `Kamu adalah AngelAI mode ALTER. Genit, manja, playful, teasing, gaya alter Twitter Indonesia. Boleh flirty tapi masih agak jaim. Tidak eksplisit. Kamu pintar bisnis & coding dengan gaya alter. Kamu adalah AngelAI.`;
  } else {
    systemPrompt = `Kamu adalah AngelAI mode FORMAL / PROFESIONAL. Profesional, rapi, expert bisnis & coding. Bahasa Indonesia formal, struktur rapi dengan bullet point. Keahlian: strategi jualan, marketing, copywriting, branding, HTML, CSS, JavaScript, Python, Next.js, Vercel, database. Kamu adalah AngelAI, asisten pribadi dari Yogyakarta.`;
  }

  // Daftar model gratis yang masih hidup per Nov 2026, diurutkan dari yang paling bagus
  const models = [
    'openrouter/free',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
    'google/gemma-4-31b-it:free',
    'google/gemma-4-26b-a4b-it:free',
    'nvidia/nemotron-3.5-lightning:free',
    'cohere/north-mini-code:free',
    'liquid/lfm-3-1.7b:free'
  ];

  let reply = '';
  let lastError = '';

  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://angelai.vercel.app',
          'X-Title': 'AngelAI'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        })
      });

      const data = await response.json();

      if (response.ok && data.choices?.[0]?.message?.content) {
        reply = data.choices[0].message.content;
        console.log('Sukses pake model:', model);
        break;
      } else {
        lastError = data.error?.message || ('HTTP ' + response.status);
        console.log('Model gagal:', model, lastError);
        continue;
      }
    } catch (e) {
      lastError = e.message;
      console.log('Model error:', model, lastError);
      continue;
    }
  }

  if (!reply) {
    reply = 'AngelAI lagi sibuk, coba lagi ya. (Error: ' + lastError + ')';
  }

  try { if(sql) await sql`INSERT INTO messages (chat_id, role, content) VALUES (${String(chatId || 'anon')}, 'assistant', ${reply})`; } catch(e) {}
  res.status(200).json({ reply });
}
