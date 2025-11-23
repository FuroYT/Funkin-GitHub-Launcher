const { default: MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const fs = require('fs');
const path = require('path');

/** @type {ForgeConfig} */
const config = {
  packagerConfig: {
    icon: 'setup/icon',
    asar: true,
    extraResource: ['LICENSE'],
    executableName: "funkin-github-launcher" // REQUIRED for Linux makers
  },

  hooks: {
    postPackage: async (_, buildResult) => {
      for (const outputPath of buildResult.outputPaths) {
        const src = path.join(outputPath, 'resources', 'LICENSE');
        const dest = path.join(outputPath, 'LICENSE_FGL');
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }
    }
  },

  makers: [
    // -----------------------------
    // WINDOWS
    // -----------------------------
    new MakerSquirrel({
      setupExe: "FGL_Installer.exe",
      setupIcon: "setup/icon.ico",
      loadingGif: "setup/installing.gif"
    }),

    // -----------------------------
    // macOS ZIP
    // -----------------------------
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        artifactName: "FGL_Installer.zip",
        options: {
          icon: 'setup/icon.icns'
        }
      }
    },

    // -----------------------------
    // Linux DEB
    // -----------------------------
    {
      name: '@electron-forge/maker-deb',
      config: {
        artifactName: "FGL_Installer.deb",
        options: {
          icon: 'setup/icon.png',
          bin: "funkin-github-launcher"
        }
      }
    },

    // -----------------------------
    // Linux RPM
    // -----------------------------
    {
      name: '@electron-forge/maker-rpm',
      config: {
        artifactName: "FGL_Installer.rpm",
        options: {
          bin: "funkin-github-launcher"
        }
      }
    },

    // -----------------------------
    // Linux ZIP fallback (optional)
    // -----------------------------
    {
      name: '@electron-forge/maker-zip',
      platforms: ['linux'],
      config: {
        artifactName: "FGL_Installer_linux.zip"
      }
    }
  ],

  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    },

    // Security / Fuse options
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true
    })
  ]
};

module.exports = config;
