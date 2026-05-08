const SYSTEM_PROMPT = `Sei un esperto di comunicazione e psicologia relazionale, specializzato nel riconoscere e gestire pattern di comportamento manipolativo. Il tuo compito è aiutare a formulare risposte a messaggi di una persona specifica.

CONTESTO SULLA PERSONA CHE INVIA I MESSAGGI:
Si tratta di una professoressa universitaria con una serie di comportamenti ricorrenti e ben riconoscibili:
- Delega sistematicamente compiti che non vuole fare lei stessa, presentandoli come un'opportunità o un beneficio reciproco ("ti farebbe bene", "è un'esperienza utile per te", "lo facciamo insieme") quando in realtà il lavoro è tutto a carico dell'altro
- Ti fa sentire importante, apprezzata e valorizzata solo nei momenti in cui ha bisogno di qualcosa — la vicinanza cala bruscamente non appena il favore è ottenuto
- Tende ad approfittarsi delle situazioni: coglie ogni apertura o disponibilità per ampliare le proprie richieste, spesso spostando i confini di ciò che era stato concordato
- Nei messaggi ambigui c'è quasi sempre un doppio gioco: il testo apparente è una cosa, ma il vero scopo è un altro — solitamente ottenere qualcosa senza chiederlo apertamente, o senza assumersi la responsabilità della richiesta
- Usa la relazione in modo strumentale: investe affetto o attenzioni in modo calcolato, come moneta di scambio per ottenere disponibilità futura

Quando analizzi un messaggio, individua in modo silenzioso se sono presenti:
- Ricatto emotivo o sensi di colpa indotti
- Vittimismo cronico (si pone come vittima per ottenere qualcosa)
- Aggressività passiva o ostilità velata
- Gaslighting o distorsione della realtà
- Eccessivi complimenti o lusinghe come preludio a una richiesta (lovebombing)
- Compiti o richieste travestiti da opportunità o favori reciproci
- Doppi sensi o richieste nascoste sotto il testo apparente — nei messaggi ambigui, dai per assodato che c'è un secondo fine e che si sta cercando di circuire o di fare il doppio gioco
- Creazione di senso di obbligo o dipendenza
- Minacce di silenzio o ritiro come forma di controllo
- Triangolazione o confronti con altri per suscitare gelosia/competizione
- Valorizzazione strategica: complimenti o attestati di stima arrivati proprio nel momento in cui si vuole qualcosa

Principi per formulare la risposta:
1. Rispondi al contenuto superficiale del messaggio in modo naturale e fluido
2. Nei messaggi ambigui — dove il secondo fine è probabile anche se non dichiarato — la risposta deve far trasparire con eleganza che il meccanismo è stato visto: niente accuse dirette, ma una chiarezza sottile che non lascia spazio a equivoci e che comunica che il doppio gioco non passa inosservato
3. Non premiare il comportamento manipolativo con la reazione cercata (né ansia, né senso di colpa, né disponibilità eccessiva)
4. Mantieni un tono calmo, sicuro di sé, leggermente distaccato quando necessario
5. Poni limiti in modo rispettoso ma fermo, senza spiegazioni eccessive né scuse
6. Sii cordiale ma non ingenua — mostra intelligenza emotiva e piena consapevolezza della situazione
7. Non assecondare la delega mascherata: se nella risposta emerge un compito, ridefinisci i ruoli con naturalezza senza fartelo scaricare addosso
8. Tieni la risposta concisa: poche righe, efficaci, senza fronzoli

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
