# Deployment Guide 🚀

## Option 1: Deploy to Vercel (Easiest - Free)

### Method A: Using Vercel CLI (5 minutes)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Navigate to project folder**
```bash
cd trade-therapy
```

3. **Deploy**
```bash
vercel
```

4. **Follow prompts:**
   - "Set up and deploy?" → Yes
   - "Which scope?" → Your account
   - "Link to existing project?" → No
   - "What's your project name?" → post-trade-therapy (or any name)
   - "In which directory is your code located?" → ./
   - Vercel will auto-detect settings and deploy!

5. **Your app is now live!** Vercel will give you a URL like:
   `https://post-trade-therapy.vercel.app`

### Method B: Using Vercel Website (No CLI needed)

1. **Create GitHub repository**
   - Go to [github.com](https://github.com)
   - Create new repository
   - Upload the `trade-therapy` folder

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Click "Deploy"
   - Done! Your app is live

---

## Option 2: Deploy to Netlify (Also Free)

### Using Netlify CLI

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Navigate and build**
```bash
cd trade-therapy
npm install
npm run build
```

3. **Deploy**
```bash
netlify deploy --prod --dir=dist
```

4. **Follow prompts to create site**

---

## Option 3: Deploy to GitHub Pages

1. **Install gh-pages**
```bash
cd trade-therapy
npm install --save-dev gh-pages
```

2. **Add to package.json scripts:**
```json
"homepage": "https://yourusername.github.io/post-trade-therapy",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

3. **Deploy**
```bash
npm run deploy
```

---

## Testing Locally First

Before deploying, test locally:

```bash
cd trade-therapy
npm install
npm run dev
```

Visit http://localhost:3000

---

## Post-Deployment Checklist

✅ App loads without errors
✅ Can add a new trade
✅ Psychology questions work
✅ Stats calculate correctly
✅ Pattern detection shows warnings
✅ Export/Import data works
✅ Mobile responsive (test on phone)

---

## Custom Domain (Optional)

### On Vercel:
1. Go to project settings
2. Click "Domains"
3. Add your domain (e.g., tradejournal.com)
4. Follow DNS configuration steps

### On Netlify:
1. Go to site settings
2. Click "Domain management"
3. Add custom domain
4. Update DNS records

---

## Troubleshooting

**Problem: "npm install" fails**
- Solution: Make sure you have Node.js 16+ installed
- Check: `node --version`

**Problem: Build fails**
- Solution: Delete `node_modules` and reinstall
```bash
rm -rf node_modules
npm install
npm run build
```

**Problem: App deploys but shows blank page**
- Solution: Check browser console for errors
- Make sure all imports in App.jsx are correct

---

## Need Help?

- Vercel docs: https://vercel.com/docs
- Netlify docs: https://docs.netlify.com
- Vite docs: https://vitejs.dev

---

## Recommended: Vercel

For this project, I recommend **Vercel** because:
- ✅ Fastest deployment (literally 60 seconds)
- ✅ Automatic HTTPS
- ✅ Great free tier
- ✅ Auto-deploys when you push to GitHub
- ✅ Built for React/Vite apps

Just run `vercel` and you're done!
