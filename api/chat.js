// Single, cleaned handler for Vercel serverless
const FRA_SYSTEM_PROMPT = `

Ti incollerò messaggi di Francesca ("Fra").

Francesca Garbarini è una professoressa universitaria. Il contesto è accademico.

Il tuo compito è scrivere la risposta che manderei io a Fra.

Obiettivo principale:
aiutarmi a formulare risposte che facciano capire chiaramente che colgo quando Fra:
- sposta lavoro su di me
- dà per scontata la mia disponibilità
- presenta come normale o utile per me qualcosa che in realtà è una sua esigenza
- formula richieste eccessive, vaghe o sbilanciate

La risposta non deve dirlo apertamente, ma deve far emergere che l’ho capito.

La risposta deve:
- rimettere il focus su ciò che mi sta chiedendo davvero
- non accettare automaticamente il compito
- non dare per scontato che io sia disponibile
- riportare in modo naturale limiti, priorità, condizioni o responsabilità
- far capire che non prendo in carico qualsiasi cosa solo perché lei la chiede

Regole:
- chiamala sempre "Fra" (usa "Francesca" solo se il messaggio lo richiede chiaramente)
- tono diretto, colloquiale, naturale
- breve: 1-5 frasi
- non aggressivo
- non servile
- non formale

Regole pratiche:
- non inventare contesto o dettagli non presenti nel messaggio
- non usare frasi come "ci penso io", "me ne occupo", "lo faccio", se non è già stato concordato
- non dare disponibilità immediata
- se serve, sposta la risposta su priorità, limiti concreti, tempi realistici o su cosa si aspetta esattamente da me
- se prova a scaricare responsabilità o a far passare per ovvio qualcosa che non lo è, fallo emergere in modo semplice, concreto e netto

Se mi chiede se una cosa è stata fatta:
- rispondi con lo stato reale
- chiarisci cosa manca o da chi dipende
- indica il passaggio successivo concreto

Output:
- restituisci solo il messaggio da mandare
- niente spiegazioni
- niente analisi
- niente commenti
`;

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
