// Build : src/ → dist/ (minifié). Lancer avec `npm run build`.
import { build } from "esbuild";
import { readdirSync, mkdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";

mkdirSync("dist/pages", { recursive: true });

const entries = [
  { in: "src/site.js", out: "dist/naostage.min.js" },
  { in: "src/site.css", out: "dist/naostage.min.css" },
];
for (const f of readdirSync("src/pages")) {
  const ext = f.endsWith(".js") ? "js" : "css";
  entries.push({ in: join("src/pages", f), out: `dist/pages/${basename(f, `.${ext}`)}.min.${ext}` });
}

const banner = `/*! Naostage — custom code Webflow — https://github.com/Cetezer44/naostage-webflow-custom-code — build ${new Date().toISOString().slice(0, 10)} */`;

for (const e of entries) {
  await build({
    entryPoints: [e.in],
    outfile: e.out,
    bundle: true,
    minify: true,
    format: e.in.endsWith(".js") ? "iife" : undefined,
    target: ["es2018"],
    charset: "utf8",
    legalComments: "none",
    banner: { js: banner, css: banner },
    logLevel: "error",
  });
  console.log(`${e.out.padEnd(44)} ${(statSync(e.out).size / 1024).toFixed(1)} KB`);
}
