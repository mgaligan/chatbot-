# RispondiBene

Mini chatbot per generare risposte intelligenti a messaggi manipolativi.

---

## Deploy gratuito su Vercel (5 minuti)

### 1. Crea un repository GitHub

1. Vai su [github.com](https://github.com) e crea un account (gratis) se non ce l'hai
2. Crea un nuovo repository (es. `rispondibene`) — può essere **privato**
3. Dalla cartella del progetto, esegui nel terminale:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/rispondibene.git
git push -u origin main
```

> **Importante:** il file `.env` è nel `.gitignore` — la chiave API **non** verrà caricata su GitHub.

---

### 2. Deploy su Vercel

1. Vai su [vercel.com](https://vercel.com) e crea un account **gratuito** (login con GitHub)
2. Click su **"Add New Project"**
3. Importa il repository `rispondibene` da GitHub
4. Nella schermata di configurazione, **non toccare nulla** — click diretto su **"Deploy"**

---

### 3. Aggiungi la chiave API

Dopo il primo deploy (pochi secondi):

1. Vai nelle impostazioni del progetto: **Settings → Environment Variables**
2. Aggiungi una nuova variabile:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** la tua chiave OpenAI
   - Seleziona tutti e tre gli ambienti: Production, Preview, Development
3. Click **Save**
4. Torna su **Deployments** → click **"Redeploy"** sull'ultimo deploy

---

### 4. Ottieni l'URL

Vercel ti assegna un URL gratuito tipo:
```
https://rispondibene-xxxx.vercel.app
```

Puoi condividerlo con chiunque. Funziona da browser, anche su mobile.

---

## Aggiornamenti futuri

Per aggiornare il chatbot, modifica i file e fai push su GitHub — Vercel si aggiorna in automatico.

```bash
git add .
git commit -m "Update"
git push
```

---

## Struttura del progetto

```
├── api/
│   └── chat.js        ← funzione serverless (chiamata a OpenAI)
├── index.html         ← interfaccia utente
├── package.json       ← configurazione Node.js
├── .gitignore         ← esclude .env dal repo
└── .env               ← chiave API locale (NON va su GitHub)
```
