# Gifting Butler

A gift-discovery web app — curated picks, smart reminders, and family wishlists for every occasion.

The web app itself is contained in a single file (`index.html`): HTML, CSS, and JavaScript are all inline, with Firebase loaded via CDN, so no build step is required to view or edit it. The repo also includes a Firebase Cloud Functions backend (`functions/`) and native mobile app wrappers built with Capacitor (`android/`, `ios/`) — see [MOBILE_APP.md](MOBILE_APP.md) for those.

## View it locally
Just double-click `index.html` — it opens in any web browser.

## Put it online with GitHub Pages (free)

1. Create a new repository on GitHub (e.g. `giftingbutler`).
2. Upload **both files** from this folder (`index.html` and this `README.md`) — drag them into the repo's upload page, or use the steps below.
3. In your repo, go to **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Set the branch to **main** and the folder to **/ (root)**, then **Save**.
6. Wait ~1 minute. Your site will be live at:
   `https://YOUR-USERNAME.github.io/giftingbutler/`

## Upload via the command line (optional)
```bash
git init
git add .
git commit -m "Initial commit: Gifting Butler"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/giftingbutler.git
git push -u origin main
```
Then enable GitHub Pages as described above.
