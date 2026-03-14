module.exports = {
  appId: 'com.cluely.copy',
  productName: 'Cluely',
  directories: {
    buildResources: 'assets',
    output: 'release',
  },
  files: [
    'dist/**/*',
    'package.json',
  ],
  mac: {
    target: 'dmg',
    category: 'public.app-category.productivity',
  },
  win: {
    target: 'nsis',
  },
  linux: {
    target: 'AppImage',
  },
}
