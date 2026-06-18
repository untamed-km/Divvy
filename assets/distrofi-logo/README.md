# DistroFi — Logo Pack

Built from your actual logo art. The circuit-tree **mark** is your real artwork (extracted
clean with a transparent background); the **DistroFi** wordmark is set in **Poppins Bold**
and outlined to paths, so it stays razor-sharp at any size and needs no font installed.

## Layouts
- **Horizontal** — mark left, wordmark right. Headers, nav bars, email signatures.
- **Stacked** — mark above, wordmark below. App splash, social avatars, square spaces.
- **Icon only** — the circuit mark alone. App icon, favicon, watermark.

## Color modes
- **color** — your full-color gradient mark + navy `Distro` / teal `Fi`. Primary logo.
- **mono-navy** — single-color navy silhouette. Light backgrounds, print, stamps.
- **mono-white** — single-color white silhouette (transparent only). Dark UI, photos, overlays.

## Backgrounds
`transparent` · `cream` (`#EFF0EA`) · `white`. (mono-white is transparent only.)

## Brand colors (sampled from your art)
| Token | Hex       | Use                       |
|-------|-----------|---------------------------|
| Navy  | `#18183A` | "Distro", mono mark, text |
| Teal  | `#0C9488` | "Fi" accent               |
| Cream | `#EFF0EA` | brand off-white background |

**Typeface:** Poppins Bold (wordmark), free on Google Fonts.

## Folder structure
```
distrofi-logo/
├── color/        svg/ + png/   (horizontal · stacked · icon × transparent · cream · white)
├── mono-navy/    svg/ + png/
└── mono-white/   svg/ + png/   (transparent only)
```
Naming: `distrofi-{layout}-{mode}-{background}.{svg|png}`

## Good to know
- **SVG construction:** the wordmark is true vector; the color mark is your high-res artwork
  embedded inside the SVG. It scales well for screen and normal print. If you ever want the
  mark as *pure vector* (infinite scaling, single editable paths), send me the original
  vector/Illustrator file or ask me to trace it — the mono silhouettes vectorize especially
  cleanly.
- PNGs are high-res (horizontal 1800px, stacked 1400px, icon 1024px). For larger, export from
  the SVG.
- App icon / favicon: start from `distrofi-icon-color-white` or the stacked mark; I can also
  generate padded iOS/Android icon sizes on request.
