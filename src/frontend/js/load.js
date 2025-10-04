async function checkStuff() {
    var pageToSend = "index";
    function sendSetup()
    {
        pageToSend = "setup";
    }

    let NotifContent = [];
    
    var gitResult = await window.backendAPI.checkGit();
    if (gitResult)
        NotifContent.push(`You have Git v${gitResult} installed`)
    else {
        NotifContent.push(`[ERROR] Git needs to be installed`)
        sendSetup();
    }

    var haxeResult = await window.backendAPI.checkHaxe();
    if (haxeResult)
        NotifContent.push(`You have Haxe v${haxeResult} installed`)
    else {
        NotifContent.push(`[ERROR] Haxe needs to be installed`)
        sendSetup();
    }

    var buildToolsResult = await window.backendAPI.checkBuildTools();
    if (!buildToolsResult) {
        NotifContent.push(`[ERROR] Build Tools needs to be installed`)
        sendSetup();
    }

    new window.Notification("Version Checking", { body: NotifContent.join("\n") });
    var gitPath = await window.storeAPI.get("funkinGitPath");
    var gitPathExists = gitPath ? window.backendAPI.pathExists(gitPath) : false;
    if (pageToSend == "index" && !gitPathExists)
        pageToSend = "cloneGit";
    window.backendAPI.switchPage(pageToSend);
}

checkStuff();