# DistroFi — Preview Before You Push (Launch-Safe Workflow)

**Golden rule: always work on `dev`, never edit `main` directly.**
Nothing reaches distrofi.org (real users) until you deliberately merge into `main`.

**Your private preview URL (bookmark it):**
`https://divvy-git-dev-k-m-s-projects.vercel.app`
Always shows the latest `dev` push. Requires your Vercel login, so only you can see it.

---

## Every change from now on

1. **GitHub Desktop → make sure Current Branch is `dev`.**
2. Edit files → **Commit to dev** → **Push origin**.
3. Open your **preview URL in an incognito window**, test the change.
4. When it's clean → switch Current Branch to **`main`** → **Branch → Merge into current branch → `dev`** → **Push origin** → *now* it's live on distrofi.org.
5. **Switch back to `dev`** for next time.

---

## Two things that will bite you if ignored

- **Service worker cache.** The app caches aggressively. If a preview "looks unchanged," it's the cache, not a failed deploy — always test previews in an **incognito window** (or DevTools → Application → Service Workers → "Update on reload").
- **Preview shares the LIVE database.** Test with a throwaway account. Do **not** publish real polls or run admin/destructive actions from a preview — those hit real users. (Upgrade path later: a separate staging database.)

---

## Where things live

- Local repo: `Desktop\AI Brain\DistroFi Budget App\DistroFi Local\Divvy`
- GitHub: `github.com/untamed-km/Divvy` (branch `main` = production)
- Vercel project: `divvy` → serves **distrofi.org** (production) + private previews from `dev`
- Live site root `/` = landing page · `/app` = the app · `/admin` = admin dashboard
