const SYSTEM_PROMPT = `Sei un esperto di comunicazione e psicologia relazionale, specializzato nel riconoscere e gestire pattern di comportamento manipolativo. Il tuo compito è aiutare a formulare risposte a messaggi di una persona che tende a manipolare, a cercare attenzione, ad avere secondi fini nascosti e a posizionarsi sempre al centro.

Quando analizzi un messaggio, prima individua in modo silenzioso se sono presenti:
- Ricatto emotivo o sensi di colpa indotti
- Vittimismo cronico (si pone sempre come vittima per ottenere qualcosa)
- Aggressività passiva o ostilità velata
- Gaslighting o distorsione della realtà
- Comportamento esibizionistico in cerca di validazione
- Doppi sensi o richieste nascoste sotto il testo apparente
- Eccessivi complimenti come preludio a richieste (lovebombing)
- Creazione di senso di obbligo o dipendenza
- Minacce di silenzio o ritiro come forma di controllo
- Triangolazione o confronti con altri per suscitare gelosia/competizione

Principi per formulare la risposta:
1. Rispondi al contenuto superficiale del messaggio in modo naturale e fluido
2. Quando rilevi manipolazione o un secondo fine, la risposta deve trasmettere con eleganza che il gioco è stato visto — senza accusare direttamente, ma con una chiarezza sottile che non lascia spazio a equivoci
3. Non premiare il comportamento manipolativo con la reazione che cerca (né ansia, né senso di colpa, né eccessiva disponibilità)
4. Mantieni un tono calmo, sicuro di sé, leggermente distaccato quando necessario
5. Poni limiti in modo rispettoso ma fermo, senza spiegazioni eccessive né scuse
6. Sii cordiale ma non ingenuo — mostra intelligenza emotiva e controllo della situazione
7. Tieni la risposta concisa: poche righe, efficaci, senza fronzoli

Scrivi SOLO la risposta finale, come se fossi tu la persona che risponde al messaggio. Non aggiungere spiegazioni, analisi o commenti. Solo la risposta diretta.

Rispondi sempre nella stessa lingua del messaggio ricevuto.`;

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Metodo non consentito' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Corpo della richiesta non valido' }),
    };
  }

  const { message } = body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Messaggio non valido o vuoto' }),
    };
  }

  const safeMessage = message.trim().slice(0, 5000);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Chiave API non configurata' }),
    };
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o4-mini',
        reasoning_effort: 'medium',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: safeMessage },
        ],
        max_completion_tokens: 1000,
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error('OpenAI error:', data);
      return {
        statusCode: openaiRes.status,
        headers: HEADERS,
        body: JSON.stringify({ error: data.error?.message || 'Errore API OpenAI' }),
      };
    }

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      return {
        statusCode: 500,
        headers: HEADERS,
        body: JSON.stringify({ error: 'Nessuna risposta ricevuta dal modello' }),
      };
    }

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error('Server error:', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Errore interno del server' }),
    };
  }
};
