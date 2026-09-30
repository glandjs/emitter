/**
 * changesets always writes a fresh CHANGELOG.md at the package root, using its
 * own heading style. This project keeps a hand-written changelog at
 * docs/CHANGELOG.md in Keep a Changelog format, so after `changeset version`
 * the newly generated entry is extracted, normalised, and merged in place.
 *
 * The post-step is a no-op when changesets found nothing to release.
 */
import { existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const generated = join(root, 'CHANGELOG.md');
const target = join(root, 'docs', 'CHANGELOG.md');

if (!existsSync(generated)) {
  console.log('No changesets were pending; docs/CHANGELOG.md is unchanged.');
  process.exit(0);
}

const incoming = readFileSync(generated, 'utf8');

/** Pull `## 1.2.3` and the body beneath it out of a changesets changelog. */
const parseEntry = (text) => {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => /^## \d/.test(line));
  if (start === -1) return null;

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      end = i;
      break;
    }
  }
  return {
    version: lines[start].replace(/^##\s*/, '').trim(),
    body: lines
      .slice(start + 1, end)
      .join('\n')
      .trim(),
  };
};

const entry = parseEntry(incoming);
if (!entry) {
  console.warn('Could not read a release entry from the generated changelog; leaving docs/CHANGELOG.md alone.');
  rmSync(generated, { force: true });
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const heading = `## [${entry.version}] - ${today}`;
const section = `${heading}\n\n${entry.body}\n`;

if (!existsSync(target)) {
  writeFileSync(target, `# Changelog\n\n${section}`, 'utf8');
  console.log(`Wrote docs/CHANGELOG.md with ${entry.version}.`);
} else {
  const current = readFileSync(target, 'utf8');
  const firstEntry = current.search(/^## /m);

  // Match on the version number, not the exact heading text: hand-written
  // entries use an en dash, and changesets uses a plain hyphen.
  const alreadyRecorded = new RegExp(`^##\\s*\\[?${entry.version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]?\\s*[–-]`, 'm').test(current);

  if (firstEntry === -1) {
    writeFileSync(target, `${current.trimEnd()}\n\n${section}`, 'utf8');
  } else if (alreadyRecorded) {
    console.log(`${entry.version} is already recorded in docs/CHANGELOG.md.`);
  } else {
    const head = current.slice(0, firstEntry).trimEnd();
    const rest = current.slice(firstEntry).trimEnd();
    writeFileSync(target, `${head}\n\n${section}\n${rest}\n`, 'utf8');
  }
  console.log(`Merged ${entry.version} into docs/CHANGELOG.md.`);
}

rmSync(generated, { force: true });
