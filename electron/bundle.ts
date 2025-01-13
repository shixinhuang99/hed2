import { type Configuration, build } from 'electron-builder';
import fs from 'fs-extra';

async function main() {
  await fs.copy('../ui/dist', './dist');
  const files = await fs.readdir('./dist');
  console.log('files', files);

  const config: Configuration = {
    productName: 'Hed2',
    appId: 'com.shixinhuang.hed2',
    directories: {
      output: '../electron-bundle',
      buildResources: '../assets',
    },
    files: ['./dist'],
    artifactName: '${productName}_${version}_${arch}-electron-setup.${ext}',
    win: {
      target: [{ target: 'nsis', arch: ['x64'] }],
    },
    mac: {
      target: [{ target: 'dmg', arch: ['universal'] }],
      category: 'public.app-category.developer-tools',
    },
    nsis: {
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: 'always',
      deleteAppDataOnUninstall: true,
      license: '../LICENSE',
      oneClick: false,
    },
    npmRebuild: false,
  };

  const result = await build({ config, publish: 'never' });

  for (const ret of result) {
    console.log(ret);
  }
}

main();
