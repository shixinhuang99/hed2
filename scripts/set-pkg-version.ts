import fs from 'node:fs/promises';

async function setPkgVersion(pkgPath: string, version: string) {
  const uiPkgContent = await fs.readFile(pkgPath, 'utf-8');
  const uiPkg = JSON.parse(uiPkgContent);
  uiPkg.version = version;
  await fs.writeFile(pkgPath, JSON.stringify(uiPkg, null, 2));
}

async function main() {
  const version = process.argv[2];
  if (!version) {
    return;
  }
  await setPkgVersion('./ui/package.json', version);
  await setPkgVersion('./electron/package.json', version);
}

main();