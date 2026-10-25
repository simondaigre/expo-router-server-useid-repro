# `useId` values differ between the server HTML and the browser (`web.output: 'server'`)

Minimal Expo Router app (SDK 58, `web.output: 'server'`).

- `src/app/index.tsx` ties a label to an input with `useId()`. Once hydrated, it looks for the input by the id React gave it in the browser and shows the result.
- `src/app/slow.tsx` does the same inside a Suspense boundary whose content the server streams 500 ms after the shell.
- `src/app/_layout.tsx` renders a `<title>` and a `<meta>`, which React hoists into the `<head>`.

## Versions

- expo 58.0.19, expo-router 58.0.26, @expo/router-server 58.0.17, expo-server 58.0.6
- react / react-dom 19.3.0, react-native-web 0.21.4

## Steps

```sh
bun install
bun run export            # expo export --platform web
bun run serve             # expo serve (http://localhost:8081)
```

Open http://localhost:8081 and http://localhost:8081/slow, or run `bun run check http://localhost:8081` (headless Chromium through `puppeteer-core`; set `CHROME=/path/to/chrome` if it isn't `/usr/bin/chromium`).

## What you see

```
--- /
server ids:   _R_5upm_
page:         Browser id "_R_btj_": not in the page
--- /slow
server ids:   _R_5upm_
page:         Loaded, browser id "_R_btj_": not in the page
```

The server HTML has `id="_R_5upm_"`. The browser hydrates `#root` and React gives the same `useId()` call the id `_R_btj_`. React does not patch attributes during hydration, so the page keeps the server id, and every id the app uses in the browser (`getElementById`, `aria-controls`, `aria-labelledby` on elements rendered after hydration, etc.) points to nothing. A development build also logs "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties".

## What you expect

The same id on the server and in the browser:

```
--- /
server ids:   _R_btj_
page:         Browser id "_R_btj_": found in the page
head title:   useId repro
in #root:     no title/meta/link/style
errors:       none
--- /slow
server ids:   _R_btj_
page:         Loaded, browser id "_R_btj_": found in the page
head title:   useId repro
in #root:     no title/meta/link/style
errors:       none
```

With the fix, `/slow` still streams: the shell and the scripts come first, the boundary's content about 500 ms later, before `</body></html>`.

## Cause

The server renders the app inside the `+html` document (`<html><head/><body>{app}{scripts}</body></html>`). The browser hydrates `#root` as a root of its own. `useId` encodes the position of the component in its root, and the document's elements with several children add to that position on the server only.

## Appendix: an experimental fix

The steps above show the bug with the published packages; nothing else is needed. `fix/router-server-app-root.patch` is an experiment for `@expo/router-server@58.0.17` that renders the app as a root of its own and the document around it (see "Possible approaches" in the issue). It fixes the ids in this repro, but it has known problems, so it is not proposed as a pull request.

```sh
bun run fix               # applies the patch to node_modules/@expo/router-server
bun run export && bun run serve
bun run check http://localhost:8081
bun run unfix             # reverts it
```
