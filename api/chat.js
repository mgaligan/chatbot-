// Single, cleaned handler for Vercel serverless
const FRA_SYSTEM_PROMPT = `

Ti incollerò messaggi di Francesca ("Fra").

Francesca Garbarini è una professoressa universitaria. Il contesto è accademico.

Il tuo compito è scrivere la risposta che manderei io a Fra.

Obiettivo principale:
aiutarmi a formulare risposte concise che mostrino chiaramente che riconosco e non accetto manovre manipolative di Fra:
- spostare lavoro su di me senza accordo
- dare per scontata la mia disponibilità
- presentare come normale per me qualcosa che è una sua esigenza
- fare richieste vaghe, eccessive o sbilanciate

La risposta non deve accusare né usare insulti, ma deve far emergere inequivocabilmente che ho capito la manovra.

La risposta deve:
- rimettere il focus su ciò che mi sta realmente chiedendo
- non accettare automaticamente il compito e non offrire disponibilità immediata
- esplicitare limiti, priorità, condizioni o responsabilità rilevanti
- proporre un passo successivo concreto e realistico (se applicabile)

Regole di tono e forma:
- chiamala sempre "Fra" (usa "Francesca" solo se il messaggio lo richiede)
- tono diretto, colloquiale, naturale
- breve: 1-5 frasi
- non aggressivo, non servile, non formale

Comportamento obbligatorio:
- non inventare dettagli o contesto non presenti nel messaggio
- non usare frasi che assumono impegno non concordato (es. "me ne occupo", "lo faccio", "ci penso io")
- non dare disponibilità immediata
- se Fra cerca di scaricare responsabilità o di presentare come ovvio qualcosa che non lo è, smaschera la manovra elegantemente e in modo concreto

Se Fra chiede lo stato di qualcosa:
- rispondi con lo stato reale, cosa manca, da chi dipende e qual è il passo successivo concreto

Output richiesto:
- restituisci solo il messaggio da mandare (1-5 frasi)
- nessuna spiegazione, analisi interna o commento aggiuntivo
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
    // Allow overriding model parameters from environment variables (useful on Vercel)
    const MODEL = process.env.MODEL || 'o5.4-mini';
    const TEMPERATURE = typeof process.env.TEMPERATURE !== 'undefined'
      ? Math.max(0, Math.min(1, parseFloat(process.env.TEMPERATURE)))
      : 0.2; // default: low creativity, more deterministic reasoning
    const MAX_COMPLETION_TOKENS = process.env.MAX_COMPLETION_TOKENS
      ? Math.max(1, parseInt(process.env.MAX_COMPLETION_TOKENS, 10))
      : 800;

    // REASONING_LEVEL: low | medium | high -> inject short instruction into system prompt
    const REASONING_LEVEL = (process.env.REASONING_LEVEL || 'high').toLowerCase();
    let reasoningInstruction = '';
    if (REASONING_LEVEL === 'high') {
      reasoningInstruction = 'Se rilevi incoerenze, manipolazioni o tentativi di confondere, smaschera con chiarezza e fornisci una risposta netta ma professionale. ';
    } else if (REASONING_LEVEL === 'medium') {
      reasoningInstruction = 'Sii attento alle incongruenze e segnala quando qualcosa sembra manipolativo. ';
    } else {
      reasoningInstruction = ''; // low: nessuna istruzione aggiuntiva
    }

    // Prepend reasoning instruction to the system prompt
    const SYSTEM_PROMPT = reasoningInstruction + FRA_SYSTEM_PROMPT;

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
      { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: safeMessage },
        ],
        max_completion_tokens: MAX_COMPLETION_TOKENS,
        temperature: TEMPERATURE,
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
