var emptyPath = "{Empty Path}";

var pathSelector = document.getElementById("pathSelector");
makeButtonClickable(pathSelector, () => {
    var thing = window.backendAPI.showOpenDialog({properties: ['openDirectory']});
    thing.then((f) => pathSelector.textContent = f);
});
pathSelector.textContent = emptyPath;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var cloneButton = document.getElementById("startCloning");
makeButtonClickable(cloneButton, async () => {
    if (pathSelector.textContent === emptyPath) {
        window.alert("A clone directory path is required");
        return;
    }

    const curPath = pathSelector.textContent;

    const pathExists = await window.backendAPI.pathExists(curPath);
    if (!pathExists) {
        window.alert("The path you specified doesn't exist");
        return;
    }

    document.getElementById("settingUp").style.display = "none";
    document.getElementById("inClone").style.display = "";

    const steps = [
        ["funkin_cloneRepo", 'git', ['clone', 'https://github.com/FunkinCrew/funkin.git', "."], curPath],
        ["funkin_getSubmodules", 'git', ['submodule', 'update', '--init', '--recursive'], curPath],
        ["haxelib_changeHaxelib", 'haxelib', ['--global', 'git', 'haxelib', 'https://github.com/FunkinCrew/haxelib.git'], curPath],
        ["haxelib_changeHmm", 'haxelib', ['--global', 'git', 'hmm', 'https://github.com/FunkinCrew/hmm.git'], curPath],
        ["hmm_setup", 'haxelib', ['--global', 'run', 'hmm', 'setup', '-y'], curPath],
        ["hmm_install", 'hmm', ['install'], curPath],
        ["lime_setup", 'haxelib', ['run', 'lime', 'setup'], curPath],
    ];

    const outputEl = document.getElementById("cmdOutput");
    outputEl.textContent = "";

    for (const [id, command, args, cwd] of steps) {
        outputEl.textContent = `Starting: ${id}\n`;

        const cmd = window.backendAPI.runCommand(`${id}_${Date.now()}`, command, args, { cwd: cwd });

        /*cmd.onOutputChanged((data) => {
            outputEl.textContent += data;
            outputEl.scrollTop = outputEl.scrollHeight;
        });*/

        try {
            await cmd.start(); // wait for this step to finish
            outputEl.textContent = `${id} finished!`;
        } catch (err) {
            outputEl.textContent = `${id} failed: ${err}`;
            break; // stop if a step fails
        }
    }

    // Save cloned repo path if clone succeeded
    window.storeAPI.set("funkinGitPath", curPath);

    outputEl.textContent = "All steps completed!";

    await new Promise(resolve => setTimeout(resolve, 2000));
    window.backendAPI.switchPage("load");
});