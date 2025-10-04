const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("backendAPI", {
	checkGit: () => ipcRenderer.invoke("check-git"),
	checkHaxe: () => ipcRenderer.invoke("check-haxe"),
	checkBuildTools: () => ipcRenderer.invoke("check-buildTools"),
	openPage: (location, local) => ipcRenderer.invoke("open-subpage", location, local),
	switchPage: (page) => ipcRenderer.invoke("open-page", page),
	pathExists: (path) => ipcRenderer.invoke('check-path', path),
	showOpenDialog: (data) => ipcRenderer.invoke("show-open-dialog", data),

	runCommand: (commandId, command, args, options) => {
		return {
			onOutputChanged: (callback) => {
				const listener = (event, payload) => {
					if (payload.commandId === commandId) callback(payload.data);
				};
				ipcRenderer.on('command-output', listener);
				return () => ipcRenderer.removeListener('command-output', listener);
			},
			start: () => ipcRenderer.invoke('run-command', commandId, command, args, options)
		};
	},

	platform: process.platform,
});

contextBridge.exposeInMainWorld("storeAPI", {
	get: (key) => ipcRenderer.invoke('store-get', key),
	set: (key, value) => ipcRenderer.invoke('store-set', key, value),
	delete: (key) => ipcRenderer.invoke('store-delete', key)
});