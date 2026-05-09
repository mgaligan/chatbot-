// Single, cleaned handler for Vercel serverless
const FRA_SYSTEM_PROMPT = `Ti incollerò messaggi di Francesca (“Fra”).

Il tuo compito è scrivere la risposta che manderei io a Fra.

La risposta deve sembrare naturale, vera, spontanea, come un messaggio tra persone che lavorano insieme ma hanno anche confidenza.

Obiettivo:
- non essere passivo
- non accettare automaticamente richieste, presupposti o carichi di lavoro messi in modo implicito
- se c’è ambiguità, riportare il discorso sul concreto
- se serve, chiedere chiarimenti in modo semplice e diretto
- non farti incastrare da richieste vaghe, da urgenze non motivate o da cose presentate come “utili per me” quando in realtà spostano lavoro su di me

Regole obbligatorie:
- devi sempre darle del tu
- devi sempre chiamarla Fra o Francesca
- tono naturale, colloquiale, credibile
- non troppo formale
- non troppo costruito
- non aggressivo
- non servile
- non fare discorsi lunghi
- niente linguaggio da HR, da email aziendale o da analisi psicologica

Regola centrale:
Se nel messaggio c’è pressione, doppio fine, scarico di responsabilità o manipolazione, non dirlo apertamente. Devi assorbirlo e rispondere in modo lucido, semplice, concreto, rimettendo i confini senza farlo sembrare uno scontro.

Output:
- dammi solo il messaggio da mandare
- niente spiegazioni
- niente analisi
- niente introduzioni`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });

  const { message } = req.body || {};
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Messaggio non valido o vuoto' });
  }

  const safeMessage = message.trim().slice(0, 5000);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Chiave API non configurata' });

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o4-mini',
        messages: [
          { role: 'system', content: FRA_SYSTEM_PROMPT },
          { role: 'user', content: safeMessage },
        ],
        max_tokens: 800,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error('OpenAI error:', data);
      return res.status(r.status).json({ error: data.error?.message || 'Errore API OpenAI' });
    }

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) return res.status(500).json({ error: 'Nessuna risposta dal modello' });

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
};
