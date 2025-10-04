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
    	extraResource: ['LICENSE']
	},
	hooks: {
		postPackage: async (forgeConfig, buildResult) => {
			for (const outputPath of buildResult.outputPaths)
			{
				const src = path.join(outputPath, 'resources', 'LICENSE');
				const dest = path.join(outputPath, 'LICENSE_FGL');
				if (fs.existsSync(src)) {
					fs.copyFileSync(src, dest);
				}
			}
			
		}
	},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel({
			setupExe: "FGL_Installer.exe",
			setupIcon: "setup/icon.ico",
			loadingGif: "setup/installing.gif",
			
			icon: "https://raw.githubusercontent.com/FuroYT/Funkin-GitHub-Launcher/refs/heads/main/setup/icon.ico"
		}),
		{
			name: '@electron-forge/maker-zip',
			platforms: ['darwin'],
			config: {
				options: {
					icon: 'setup/icon.icns'
				}
			}
		},
		{
			name: '@electron-forge/maker-deb',
			config: {
				options: {
					icon: 'setup/icon.png'
				}
			}
		},
		{
			name: '@electron-forge/maker-rpm',
			config: {},
		},
	],
	plugins: [
		{
			name: '@electron-forge/plugin-auto-unpack-natives',
			config: {},
		},
		// Fuses are used to enable/disable various Electron functionality
		// at package time, before code signing the application
		new FusesPlugin({
			version: FuseVersion.V1,
			[FuseV1Options.RunAsNode]: false,
			[FuseV1Options.EnableCookieEncryption]: true,
			[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
			[FuseV1Options.EnableNodeCliInspectArguments]: false,
			[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
			[FuseV1Options.OnlyLoadAppFromAsar]: true
		}),
	],
};

module.exports = config;