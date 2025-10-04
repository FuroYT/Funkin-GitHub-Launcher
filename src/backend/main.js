const { app, dialog, BrowserWindow, ipcMain, nativeImage } = require('electron')
const path = require('node:path')
const { exec } = require("child_process");
const { existsSync } = require('node:fs');
const { spawn } = require('child_process');

const Store = require("electron-store");
const store = new Store();

if (require('electron-squirrel-startup')) app.quit(); // quit when its installing ig

let mainWindow = null;
const loadPage = (page) => {
	console.log(`Switching to "${page}"`);
	if (mainWindow != null)
		mainWindow.loadFile(`src/frontend/${page}.html`)
}
const createWindow = () => {
	if (mainWindow != null) {
		mainWindow.close();
	}

	mainWindow = new BrowserWindow({
		width: 1280,
		height: 720,
		minWidth: 1238,
		minHeight: 187, 
		title: "Funkin' GitHub Launcher",
		accentColor: "#393d3e",
		webPreferences: {
			preload: path.join(__dirname, 'preload.js')
		},
	});
	mainWindow.removeMenu();
	//mainWindow.webContents.openDevTools({mode: 'detach'});

	loadPage("load");
}


app.whenReady().then(() => {
	createWindow()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

ipcMain.handle('run-command', (event, commandId, command, args = [], options = {}) => {
	const defaultOptions = {
        cwd: options.cwd || process.cwd(),
        shell: true
    };
    return new Promise((resolve, reject) => {
		const spawnOptions = { ...defaultOptions, ...options };
        const cmdProcess = spawn(command, args, spawnOptions);

        cmdProcess.stdout.on('data', (data) => {
			console.log(`[${commandId}] ${data.toString()}`);
            event.sender.send('command-output', { commandId, data: data.toString() });
        });

        cmdProcess.stderr.on('data', (data) => {
			console.log(`[${commandId}] ${data.toString()}`);
            event.sender.send('command-output', { commandId, data: data.toString() });
        });

        cmdProcess.on('close', (code) => {
            if (code === 0) resolve({ commandId, success: true });
            else reject({ commandId, success: false, code });
        });
    });
});

ipcMain.handle("show-open-dialog", async (event, data) => {
	const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), data);
    
    if (result.canceled) {
        return null; // user canceled
    } else {
        return result.filePaths; // first selected folder
    }
})

ipcMain.handle('check-path', (event, path) => {
    return existsSync(path); // returns true or false
});

ipcMain.handle("open-page", (event, page) => {
	loadPage(page);
});

let subpage = null;
ipcMain.handle("open-subpage", (event, location, local) => {
	if (subpage != null) {
		subpage.destroy();
	}
	subpage = new BrowserWindow({
		width: 1280 - 200,
		height: 720 - 200,
		parent: mainWindow,
		modal: true,
		fullscreenable: false,
		title: "Funkin' GitHub Launcher",
		accentColor: "#393d3e",
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false
		},
		resizable: false
	});
	subpage.removeMenu();

	var isLocal = local ?? false;
	if (isLocal)
		subpage.loadFile(`src/frontend/${location}.html`)
	else
		subpage.loadURL(location);
})

ipcMain.handle("check-git", async () => {
	return new Promise((resolve) => {
		exec("git --version", (error, stdout) => {
		if (error) {
			resolve(false); // git not installed
		} else {
			var gitResult = stdout.trim();
			var match = gitResult.match(/\d+\.\d+\.\d+/);
			var versionOnly = match ? match[0] : gitResult;
			resolve(versionOnly.trim()); // return version string
		}
		});
	});
});
ipcMain.handle("check-haxe", async () => {
	return new Promise((resolve) => {
		exec("haxe --version", (error, stdout) => {
			if (error) {
				resolve(false); // haxe not installed
			} else {
				resolve(stdout.trim()); // return version string
			}
		});
	});
});
ipcMain.handle("check-buildTools", async () => {
	var command = "";
	if (process.platform == "win32")
	{
		const programFilesX86 = process.env["ProgramFiles(x86)"];
		const installerPath = path.join(programFilesX86, "Microsoft Visual Studio", "Installer");
		const vswherePath = path.join(installerPath, "vswhere.exe");
		if (! (existsSync(installerPath) && existsSync(vswherePath))) {
			return new Promise((resolve) => {
				resolve(false);
			});
		} else {
			command = `"${vswherePath}" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`
		}
	}
	else if (process.platform === "darwin") //idk why macos is named darwin too
		command = "xcode-select -p";
	else if (process.platform === "linux")
		command = "gcc --version";
	else {
		return new Promise((resolve) => {
				resolve(false);
		}); // Unsupported platform (fucking webassembly and shit)
	}
	
	return new Promise((resolve) => {
		exec(command, (error, stdout) => {
			if (error) {
				resolve(false); // buildTools not installed
			} else {
				resolve(stdout.trim()); // return path or version or whatever
			}
		});
	});
});

// Handle requests from renderer
ipcMain.handle('store-get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('store-set', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('store-delete', (event, key) => {
  store.delete(key);
  return true;
});