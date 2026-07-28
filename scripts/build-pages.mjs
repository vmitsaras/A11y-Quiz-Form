import { copyFile, cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const examplesRoot = join(projectRoot, "examples");
const landingSource = join(projectRoot, "index.html");
const siteHeaderSource = join(projectRoot, "site-header.css");
const socialPreviewSource = join(projectRoot, ".github", "social-preview.png");
const distRoot = join(projectRoot, "dist");
const pagesRoot = join(projectRoot, "docs");
const pagesDist = join(pagesRoot, "dist");

const requiredFiles = [
  landingSource,
  siteHeaderSource,
  socialPreviewSource,
  join(examplesRoot, "basic", "index.html"),
  join(examplesRoot, "demo-shell.css"),
  join(distRoot, "index.js"),
  join(distRoot, "styles.css"),
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Cannot generate GitHub Pages output: missing ${file}`);
  }
}

await rm(pagesRoot, { recursive: true, force: true });
await mkdir(pagesDist, { recursive: true });
const landingHtml = await readFile(landingSource, "utf8");
await writeFile(
  join(pagesRoot, "index.html"),
  landingHtml.replaceAll("./examples/", "./"),
  "utf8",
);

const exampleEntries = await readdir(examplesRoot, { withFileTypes: true });
for (const entry of exampleEntries) {
  if (!entry.isDirectory()) continue;

  const sourceDirectory = join(examplesRoot, entry.name);
  const outputDirectory = join(pagesRoot, entry.name);
  await cp(sourceDirectory, outputDirectory, { recursive: true });

  const outputIndex = join(outputDirectory, "index.html");
  if (existsSync(outputIndex)) {
    const html = await readFile(outputIndex, "utf8");
    await writeFile(
      outputIndex,
      html
        .replaceAll("../../dist/", "../dist/")
        .replaceAll("../../site-header.css", "../site-header.css")
        .replaceAll("../../index.html", "../index.html"),
      "utf8",
    );
  }
}

await copyFile(join(examplesRoot, "demo-shell.css"), join(pagesRoot, "demo-shell.css"));
await copyFile(siteHeaderSource, join(pagesRoot, "site-header.css"));
await copyFile(socialPreviewSource, join(pagesRoot, "social-preview.png"));

for (const runtimeFile of ["index.js", "index.js.map", "styles.css"]) {
  const sourceFile = join(distRoot, runtimeFile);
  if (existsSync(sourceFile)) await copyFile(sourceFile, join(pagesDist, runtimeFile));
}

await writeFile(join(pagesRoot, ".nojekyll"), "", "utf8");

if (!existsSync(join(pagesRoot, "index.html"))) {
  throw new Error("GitHub Pages generation failed: docs/index.html was not created.");
}

console.log("Generated GitHub Pages site in docs/.");
