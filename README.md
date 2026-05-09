# Calendario Esami: Pianifica Sessioni e Date in Modo Semplice

<img src="./public/banner.png" alt="Calendario Esami preview" width="100%" />

Applicazione web leggera per organizzare corsi e date d'esame partendo da file CSV oppure da una configurazione creata manualmente.

---

## Features

### Input e Configurazione
- Import CSV con formato Corso;Data
- Creazione configurazione da zero anche senza CSV
- Gestione di piu file/configurazioni con selettore dedicato
- Persistenza locale automatica via localStorage

### Gestione Corsi
- Aggiunta nuovo corso con nome progressivo automatico
- Aggiunta rapida di una data iniziale al nuovo corso
- Rimozione corso
- Reset singolo corso o reset intero file
- Personalizzazione colore per corso

### Gestione Date
- Modifica date tramite input calendario
- Rimozione date singole
- Ordinamento automatico cronologico

### Visualizzazione Calendario
- Raggruppamento esami per mese
- Evidenziazione visiva per materia/colore
- Stato vuoto guidato quando non ci sono esami

### Export
- Export CSV con nome personalizzabile
- Export PDF tramite stampa browser

---

## Tech Stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/) per state management
- [Lucide React](https://lucide.dev/) per icone UI
- CSS modulare per componenti e layout

---

## Getting Started

```bash
npm install
npm run dev
```

Per la build di produzione:

```bash
npm run build
```
