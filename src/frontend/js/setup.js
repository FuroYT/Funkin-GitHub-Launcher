async function checkStuff() {
    var gitResult = await window.backendAPI.checkGit();
    if (gitResult)
        removeFromID("gitInstall")
    else {
        var el = makeElementVisible("gitInstall");
        makeButtonClickable(el, () => {
            window.backendAPI.openPage("https://git-scm.com/downloads");
        });
    }

    var haxeResult = await window.backendAPI.checkHaxe();
    if (haxeResult)
        removeFromID("haxeInstall")
    else {
        var el = makeElementVisible("haxeInstall");
        makeButtonClickable(el, () => {
            window.backendAPI.openPage("https://haxe.org/download/version/4.3.7/");
        });
    }

    var buildToolsResult = await window.backendAPI.checkBuildTools();
    if (buildToolsResult) {
        removeFromID("buildToolsInstall")
    } else {
        var el = makeElementVisible("buildToolsInstall");
        makeButtonClickable(el, () => {
            var urlToOpen = "";
            if (window.backendAPI.platform == "win32") {
                window.alert(`When prompted, select "Individual Components" and make sure to download the following:\n- MSVC v143 VS 2022 C++ x64/x86 build tools\n-Windows 10/11 SDK`);
                urlToOpen = "https://aka.ms/vs/17/release/vs_BuildTools.exe";
            } else if (window.backendAPI.platform == "darwin") //idk why macOS is named darwin lmfao
                urlToOpen = "https://developer.apple.com/xcode/";
            else if (window.backendAPI.platform == "linux")
                urlToOpen = "https://gcc.gnu.org/install/";

            window.backendAPI.openPage(urlToOpen);
        });
    }

    if (window.backendAPI.platform != "linux")
    {
        removeFromID("linuxStuffInstall")
    } else {
        var el = makeElementVisible("linuxStuffInstall");
        makeButtonClickable(el, () => {
            window.backendAPI.openPage("linuxOnlySetup", true);
        });
    }
    
    var rel = makeElementVisible("restartAndCheck");
    makeButtonClickable(rel, () => {
        window.backendAPI.switchPage("load");
    });
}

checkStuff();