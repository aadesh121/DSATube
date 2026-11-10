# DSATube

A YouTube-style site made only of DSA videos: thousands of tutorials, lectures and
interview walkthroughs, 1000+ playlists, related-video suggestions, and sharp
thumbnails. React + Tailwind + shadcn/ui components. No API keys needed.

---

## 1. Install these first

| Tool | Version | Check with | Download |
|------|---------|-----------|----------|
| Python | 3.9+ | `python --version` | python.org |
| Node.js | 18+ | `node --version` | nodejs.org |
| Git (only to deploy) | any | `git --version` | git-scm.com |

If `python` isn't found, use `python3` (and `pip3`) everywhere below.

## 2. Collect the data (the big step)

Open a terminal inside the folder, then:

    pip install -r requirements.txt
    python collect.py

It does three things:
1. **Videos:** about 1,800 YouTube searches (14 topics x many terms x 12 styles such as
   "tutorial", "in python", "in hindi"). Keeps DSA videos of 90 seconds to 12 hours,
   removes duplicates and live streams. Stops at 12,000 videos (`--target`).
2. **Real YouTube playlists:** finds up to 500 DSA playlists (`--playlists`) and saves
   the videos inside them.
3. **Collections:** builds 1000+ more playlists from your video list (by topic, language,
   channel, "for beginners", "interview questions", ...). These show as
   "DSATube collection" so you can tell them apart from real YouTube playlists.

**It takes a long time** (roughly 1-2 hours for everything). That's normal; you'll see
progress lines. **It is safe to stop:** press Ctrl+C any time, progress is saved, and
running `python collect.py` again continues where it stopped.
For short sessions: `python collect.py --max-minutes 20`

Result: `public/videos.json` and `public/playlists.json`.
The exact numbers depend on what YouTube returns. If you end with fewer than 1000
playlists, run it again (more videos means more collections).

## 3. Run the website

    npm install
    npm run dev

Open http://localhost:5173

## 4. Build the final site

    npm run build

The finished website is the `dist/` folder. Upload it to any static host
(Netlify, Vercel, Cloudflare Pages, GitHub Pages).

## 5. Deploy free on GitHub Pages

1. Do step 2 on your computer first, so the data files are full.
2. Create an empty repository on github.com named `dsatube`.
3. In this folder run:

       git init
       git add .
       git commit -m "first commit"
       git branch -M main
       git remote add origin https://github.com/YOUR-USERNAME/dsatube.git
       git push -u origin main

4. GitHub: **Settings > Pages > Build and deployment > Source: GitHub Actions**.
5. **Actions** tab > "Update videos and deploy" > **Run workflow**.
6. In about 2 minutes: `https://YOUR-USERNAME.github.io/dsatube/`

Every day GitHub tries to add more data and redeploys. YouTube sometimes blocks GitHub's
servers; then the site just keeps the data you uploaded. Re-run `python collect.py` on
your own computer now and then and push the result.

## 6. Using the site

- **Tabs:** Home, Playlists, Watch later, Liked videos, Watch history. Liked, saved and
  history are stored in your browser.
- **Home:** topic buttons, length filter, search (press `/`), more videos load as you scroll.
- **Watching:** the player is on the left and 40 related videos are on the right
  (below the player on phones). Press the player's fullscreen button and it fills the
  screen on its own, with no suggestions.
- **Playlists:** each card opens a page listing every video inside, with Play all and
  Shuffle. While a playlist plays, the queue shows above the related videos with
  previous / next buttons.
- The browser Back button works everywhere and returns you to where you were.

## 7. About thumbnails

YouTube does not provide 4K thumbnails. The largest it offers is "maxres" (up to
1280x720), and DSATube always loads that one. If a video has no maxres thumbnail it
automatically falls back to the next best size.

## 8. Options for collect.py

| Option | Meaning |
|--------|---------|
| `--target 20000` | stop video search at this many videos (default 12000) |
| `--playlists 800` | real YouTube playlists to fetch (default 500, `--skip-playlists` to skip) |
| `--pl-videos 100` | max videos taken from one playlist (default 60) |
| `--max-collections 2000` | cap on generated collections (default 1500) |
| `--per-query 100` | results requested per search (default 60) |
| `--max-minutes 30` | stop after 30 minutes |
| `--reset` | forget finished searches and search everything again |

Add favourite channels to `CHANNELS` and new search terms to `TOPICS` at the top of `collect.py`.

## 9. Troubleshooting

| Problem | Fix |
|---------|-----|
| "No videos yet" | Run step 2, then refresh |
| Playlists tab empty | Run `python collect.py` (it builds `playlists.json`) |
| `yt-dlp is missing` | `pip install -r requirements.txt` |
| "YouTube returned nothing 6 times" | YouTube is rate-limiting you. Wait 30-60 min and run again (it resumes). Avoid VPNs |
| Few real playlists | Normal if YouTube changes its search page. `pip install -U yt-dlp`, run again. Collections still fill the tab |
| Collector seems stuck | Each search takes a few seconds. Ctrl+C is safe |
| `npm install` fails | Update Node.js to 18 or newer |
| Blank page after GitHub deploy | Wait 2 min, then hard refresh (Ctrl+Shift+R) |
| A video won't play | Its owner disabled embedding. Use the "YouTube" button on the watch page |

## 10. Project layout

    collect.py                 collector: videos, playlists, collections
    requirements.txt           Python dependency (yt-dlp)
    data/state.json            remembers finished searches so runs can resume
    public/videos.json         video list (generated)
    public/playlists.json      playlist list (generated)
    src/App.jsx                routing, tabs, filters, infinite scroll
    src/components/            WatchPage, PlaylistPage, cards, Thumb, ui/ (shadcn-style)
    src/lib/related.js         "related videos" ranking
    src/lib/library.js         Liked / Watch later / History (browser storage)
    .github/workflows/         daily update + deploy
