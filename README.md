# Naostage — custom code Webflow

Code CSS/JS personnalisé du site [naostage.com](https://www.naostage.com) (Webflow), versionné ici et servi par **jsDelivr**.
Dans Webflow, les blocs "Custom code" ne contiennent plus que des balises `<link>` / `<script>` qui pointent vers `dist/`.

## URLs jsDelivr

```
https://cdn.jsdelivr.net/gh/Cetezer44/naostage-webflow-custom-code@<TAG>/dist/naostage.min.css
https://cdn.jsdelivr.net/gh/Cetezer44/naostage-webflow-custom-code@<TAG>/dist/naostage.min.js
https://cdn.jsdelivr.net/gh/Cetezer44/naostage-webflow-custom-code@<TAG>/dist/pages/<page>.min.css
https://cdn.jsdelivr.net/gh/Cetezer44/naostage-webflow-custom-code@<TAG>/dist/pages/<page>.min.js
```

`<TAG>` = tag git (ex. `v1.0.0`). Les URLs taguées sont immuables et mises en cache définitivement par jsDelivr : **pour déployer une modification, on crée un nouveau tag puis on met à jour le tag dans les snippets Webflow** (site + pages concernées). Les snippets à coller sont dans `webflow/`.

## Structure

| Dossier | Contenu |
|---|---|
| `src/js/`, `src/css/` | Un fichier par fonctionnalité (code d'origine, à peine retouché : ajout de gardes `if (!el) return`) |
| `src/site.js`, `src/site.css` | Bundle **site-wide** (chargé sur toutes les pages) |
| `src/pages/*.{js,css}` | Bundles **par page** (chargés via le custom code de la page) |
| `dist/` | Fichiers minifiés servis par jsDelivr — **commités** (jsDelivr lit le repo, pas de build côté CDN) |
| `webflow/` | Snippets exacts à coller dans Webflow (Site settings → Custom code, et Page settings → Custom code) |
| `backup/<date>/` | Sauvegarde brute du custom code Webflow **avant** migration (head/footer site + contenu de chaque Embed) |

## Où va chaque fonctionnalité

### Site-wide — `dist/naostage.min.{css,js}`
| Module | Origine Webflow | Rôle |
|---|---|---|
| `global-styles` | Composant *Global Styles* | Utilitaires Client-First (hide, margin-0, text-style-2lines…) |
| `nav-header`, `nav-dropdown` | Composants *Main Header*, *Navigation Header* | Mega-menu, nav scrolled, breakpoints burger, dropdown `.dp-menu` |
| `nav-scroll` | Footer site | Ajoute `.nav_scrolled` après 30 px de scroll |
| `language-modal` | Footer site | Modal FR/EN + mémorisation `localStorage` + redirection locale |
| `anim-text-reveal`, `anim-fade-up` | Composant *Main Header* | Animations GSAP/ScrollTrigger via `data-anim="text-reveal"` / `"fade-up"` |
| `video-youtube` | Composant *Main Header* | Poster cliquable → YT.Player (`.video_container`) |
| `lightbox` | Composant *Main Header* | Lightbox images `.image-wrapper` |
| `marquee-applications` | Composant *Section Application - Page de Solution* (+ Accueil) | Marquee drag/inertie `.list-applications-home` |

### Par page — `dist/pages/<page>.min.{css,js}`
| Page | Modules |
|---|---|
| `home` (Accueil) | `marquee-recognitions`, `marquee-partners`, `marquee-testimonials`, `carousel-showcases` |
| `a-propos` | `slider-about` (Swiper équipe) |
| `contact` | `contact-form` (champ "Autres" conditionnel, honeypot anti-spam) |
| `faq` | `faq-accordion`, `kapta-calculator` (le **markup HTML** du calculateur reste dans l'Embed Webflow, seuls CSS/JS sont ici) |
| `network` | `marquee-partners`, `network-map` (carte Leaflet des revendeurs) |
| `categorie-applications` | `applications-category` (couleurs des tags solution, layout alterné) |

### Resté dans Webflow (volontairement)
- Balises **GA4 / GTM**, `hreflang`, `google-site-verification` (head site) et le `<noscript>` GTM (footer site).
- Librairies tierces déjà sur CDN : Leaflet, jQuery (+UI, easing), Swiper, Finsweet Autovideo, GSAP + ScrollTrigger.
- Embeds qui contiennent du **markup** : vidéos `<video>` (showreel, section vidéo solution FR/EN), icônes SVG inline (*Item Scope*, *Item Details*), inputs cachés + script de la page 401, markup du calculateur KAPTA.
- Les 4 mini-embeds de couleur par solution (`.sol-color-txt/.sol-color-bg` sur K SYSTEM Sense/Flow/Custom, BEAKON Module) et l'override `.mega-menu-ecole-container` de la page *Components Navigation Smartphone* : spécifiques à une page, ~100 octets, pas d'intérêt à externaliser.

## Modifier le code

```bash
npm install          # une fois
# éditer src/…
npm run build        # régénère dist/
git commit -am "…"
git tag v1.1.0 && git push && git push --tags
```
Puis remplacer `@v1.0.0` par `@v1.1.0` dans les snippets Webflow (site + pages) et publier le site.

> Astuce : pour tester sans tag, on peut pointer temporairement sur `@main` ; jsDelivr met alors les fichiers en cache ~12 h (purge possible via `https://purge.jsdelivr.net/gh/Cetezer44/naostage-webflow-custom-code@main/dist/naostage.min.js`).

## Restaurer l'état d'avant migration
Tout est dans `backup/2026-11-07/` : `site-head.html`, `site-footer.html` et un fichier par Embed (`cmp_*` = dans un composant, `home_*` = page Accueil, `page_*` = autres pages). Le fichier `backup/2026-11-07/inventory.json` donne l'ID d'élément Webflow de chaque Embed.
