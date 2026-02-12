# Post-Trade Therapy 🧠📊

A psychology-first trading journal that helps traders identify emotional patterns and improve their trading mindset.

## Features

- **Trade Logging** - Record wins and losses with P&L tracking
- **Psychology Questionnaires** - Different questions for wins vs losses
- **Pattern Detection** - Automatically identifies revenge trading, FOMO, overconfidence, and more
- **Journal Entries** - Pre-trade and post-trade notes
- **Stats Dashboard** - Win rate, average P&L, total trades
- **Import/Export** - Backup your data as JSON
- **Mobile Responsive** - Works great on all devices

## Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start dev server:
```bash
npm run dev
```

3. Open http://localhost:3000

### Build for Production

```bash
npm run build
```

This creates a `dist` folder with optimized files.

## Deploy to Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts. Your app will be live in seconds!

### Alternative: Deploy via GitHub

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Vite and deploy

## Deploy to Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build and deploy:
```bash
npm run build
netlify deploy --prod --dir=dist
```

## Data Storage

- Data is stored in browser localStorage
- Import/Export feature allows backups
- No backend required

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)
- LocalStorage API

## Psychology Patterns Detected

- 🔴 Revenge Trading
- 🔴 FOMO Entries
- 🔴 Stop Loss Moving
- 🔴 Impulsive Trades
- 🔴 Plan Discipline Issues
- 🔵 Overconfidence Streaks

## License

MIT
