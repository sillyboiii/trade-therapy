# Setup Guide 🚀

## Prerequisites

You need **Node.js 16+** installed on your computer.

**Check if you have Node.js:**
```bash
node --version
```

**Don't have Node.js?**
Download from: https://nodejs.org (get the LTS version)

---

## Quick Start (Automated)

### On Mac/Linux:
```bash
./start.sh
```

### On Windows:
```bash
start.bat
```

This script will:
1. Install all dependencies
2. Ask if you want to run locally or deploy
3. Handle everything for you!

---

## Manual Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Choose Your Path

**Option A: Run Locally**
```bash
npm run dev
```
Then visit: http://localhost:3000

**Option B: Build for Production**
```bash
npm run build
```
Creates optimized files in `dist/` folder

**Option C: Deploy to Vercel**
```bash
npm install -g vercel
vercel
```

---

## What You Get

Your trading journal will have:
- ✅ Trade logging with psychology questions
- ✅ Pattern detection (revenge trading, FOMO, etc.)
- ✅ Stats dashboard
- ✅ Journal entries with notes
- ✅ Import/Export functionality
- ✅ Mobile responsive design

---

## Project Structure

```
trade-therapy/
├── src/
│   ├── App.jsx           # Main application
│   ├── main.jsx          # React entry point
│   └── index.css         # Styles
├── index.html            # HTML template
├── package.json          # Dependencies
├── vite.config.js        # Build config
├── tailwind.config.js    # Tailwind config
└── README.md            # Documentation
```

---

## Available Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## Deploy to Vercel (Recommended)

**Fastest way:**
```bash
npm install -g vercel
vercel
```

**Or use the website:**
1. Push code to GitHub
2. Go to vercel.com
3. Import your repository
4. Done!

**You'll get a URL like:**
`https://your-app-name.vercel.app`

---

## Deploy to Netlify

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

---

## Customization

### Change Colors
Edit `src/App.jsx`:
- Search for `purple-600` and replace with your color
- Tailwind colors: blue, green, red, pink, indigo, etc.

### Change App Name
Edit `index.html`:
```html
<title>Your App Name</title>
```

### Add Your Logo
Replace the Brain icon in `src/App.jsx`

---

## Data Storage

- **Where:** Browser localStorage
- **Persistence:** Data stays on your device
- **Backup:** Use the Export button to save as JSON
- **Restore:** Use the Import button to load backup

---

## Browser Support

Works on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

---

## Troubleshooting

**Problem: npm install fails**
```bash
# Clear npm cache
npm cache clean --force
# Try again
npm install
```

**Problem: Port 3000 already in use**
```bash
# Kill the process
killall node
# Or use different port
npm run dev -- --port 3001
```

**Problem: Build fails**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Problem: Blank page after deployment**
- Check browser console (F12) for errors
- Make sure all files uploaded correctly
- Try clearing browser cache

---

## Next Steps

1. **Test locally first**
   - Run `npm run dev`
   - Add a few test trades
   - Check all features work

2. **Deploy**
   - Choose Vercel (easiest)
   - Deploy with one command
   - Get your live URL

3. **Share**
   - Share the URL with fellow traders
   - Get feedback
   - Iterate and improve!

---

## Support

- **Issues:** Check DEPLOYMENT.md
- **Questions:** Re-read this guide
- **Updates:** Pull latest from repository

---

## License

MIT - Free to use and modify!

---

**Ready to deploy?**
```bash
vercel
```

That's it! 🎉
