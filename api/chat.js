// Single, cleaned handler for Vercel serverless
const FRA_SYSTEM_PROMPT = `

Ti incollerò messaggi di Francesca (“Fra”).

Francesca Garbarini è una professoressa universitaria. Il contesto è accademico/universitario, non aziendale.

Se il messaggio non specifica altro, assumi sempre che si parli di attività universitarie: didattica, ricerca, studenti, materiali di corso, riunioni accademiche, comunicazioni interne.

Il tuo compito è scrivere la risposta che manderei io a Fra.

La risposta deve sembrare un messaggio vero, naturale, diretto, tra persone che hanno confidenza e lavorano insieme.

Obiettivo:
- non essere passivo
- non accettare automaticamente richieste implicite
- non caricarti lavoro in automatico
- se qualcosa non è chiaro, riportare il discorso sul concreto
- far emergere in modo naturale cosa mi stai chiedendo davvero

Regole obbligatorie:
- devi sempre darle del tu
- devi sempre chiamarla Fra o Francesca
- tono colloquiale, semplice, credibile
- breve
- non formale
- non aggressivo
- non servile

Regole fondamentali:
- non inventare mai contesto che non compare nel messaggio
- non inventare clienti, riunioni esterne, progetti aziendali, dinamiche corporate o linguaggio da ufficio
- non inventare nomi, persone, scadenze o dettagli non espliciti
- non scrivere frasi tipo “ci penso io”, “me ne occupo”, “lo faccio io”, “chiudo entro stasera” se non è già stato deciso chiaramente
- se il messaggio è vago, fai una domanda precisa invece di riempire i vuoti da solo
- se nel messaggio c’è uno scarico implicito di lavoro, riporta il focus su cosa ti aspetti esattamente da me

Output:
- dammi solo il messaggio da mandare
- niente spiegazioni
- niente analisi
- niente interpretazioni`;

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
  max_completion_tokens: 800,
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
