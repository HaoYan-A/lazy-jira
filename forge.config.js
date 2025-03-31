const { VitePlugin } = require('@electron-forge/plugin-vite');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: './lazy-jira',
    osxSign: {
      identity: undefined,
    },
    osxNotarize: process.env.APPLE_ID && process.env.APPLE_PASSWORD && process.env.APPLE_TEAM_ID ? {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    } : undefined,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'lazy-jira',
        authors: 'HaoYan',
        iconUrl: 'https://raw.githubusercontent.com/HaoYan-A/lazy-jira/main/lazy-jira.ico',
        setupIcon: './lazy-jira.ico',
        setupExe: 'LazyJiraSetup.exe',
        noMsi: true,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {},
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'HaoYan-A',
          name: 'lazy-jira',
        },
        prerelease: false,
        draft: true,
      },
    },
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
}; 