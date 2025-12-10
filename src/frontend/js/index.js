//-- PLATFORM SELECTION --//

var platformBtn = document.getElementById("platform");
var allowedBuildPlatforms = ["Html5"];
if (window.backendAPI.platform == "win32")
    allowedBuildPlatforms.push("Windows")
else if (window.backendAPI.platform == "darwin")
    allowedBuildPlatforms.push("Mac")
else if (window.backendAPI.platform == "linux")
    allowedBuildPlatforms.push("Linux")

allowedBuildPlatforms.reverse();
var platformIndex = 0;
platformBtn.textContent = allowedBuildPlatforms[platformIndex];
makeButtonClickable(platformBtn, () => {
    platformIndex = (platformIndex + 1) % allowedBuildPlatforms.length;
    platformBtn.textContent = allowedBuildPlatforms[platformIndex];
});

//-- SETTINGS --//

makeButtonClickable("changeDirectory", () => {
    window.backendAPI.switchPage("cloneGit");
});

var curBgColor = sessionStorage.getItem("FGL_BackgroundColor");
var doesTintColor = sessionStorage.getItem("FGL_BackgroundTinted") === "true";

var toggleBgTint = document.querySelector(`#tintBg input`);
var bgColorSlider = document.getElementById("BackgroundColorSlider");

bgColorSlider.addEventListener("input", (ev) => {
	curBgColor = ev.target.value;
	updateBgColor(toggleBgTint.checked, curBgColor);
});
toggleBgTint.addEventListener("change", (ev) => {
	updateBgColor(ev.target.checked, curBgColor);
});

//default values
bgColorSlider.value = curBgColor ?? 0;
toggleBgTint.checked = doesTintColor ?? false;

makeButtonClickable("settingsButton", () => {
	makeButtonUnclickable("pullRequest");
	makeButtonUnclickable("platform");
	makeButtonUnclickable("startBuild");
	makeButtonUnclickable("changeDirectory");
	makeButtonUnclickable("settingsButton");
	makeElementVisible("settingsPopup");
});

makeButtonClickable("closeSettings", () => {
	makeButtonClickable("pullRequest");
	makeButtonClickable("platform");
	makeButtonClickable("startBuild");
	makeButtonClickable("changeDirectory");
	makeButtonClickable("settingsButton");
	makeElementInvisible("settingsPopup");

	sessionStorage.setItem("FGL_BackgroundColor", bgColorSlider.value ?? 0);
	sessionStorage.setItem("FGL_BackgroundTinted", toggleBgTint.checked ?? false);
	
	window.storeAPI.set("FGL_BackgroundColor", bgColorSlider.value ?? 0);
	window.storeAPI.set("FGL_BackgroundTinted", toggleBgTint.checked ?? false); // update settings for other pages
});

//-- PULL REQUESTS PART --//

function enableScrollingText(button, speed = 1, pause = 1000, easingFn = t => t) {
	const span = button.querySelector("span");
	if (!span) return;

	let t = 0;
	let direction = 1;
	let lastTime = null;
	let pausedUntil = 0;

	span.style.position = "relative";
	span.style.willChange = "transform";

	function step(timestamp) {
		if (!lastTime) lastTime = timestamp;
		const delta = timestamp - lastTime;
		lastTime = timestamp;

		const btnWidth = button.offsetWidth;
		const textWidth = span.scrollWidth;

		if (!btnWidth || !textWidth || textWidth <= btnWidth) {
		span.style.transform = "translateX(0px)";
		requestAnimationFrame(step);
		return;
		}

		const maxScroll = textWidth - btnWidth;

		if ((t <= 0 && direction === -1) || (t >= 1 && direction === 1)) {
			if (!pausedUntil)
				pausedUntil = timestamp + pause;
			if (timestamp < pausedUntil) {
				requestAnimationFrame(step);
				return;
			} else {
				pausedUntil = 0;
				direction *= -1;
			}
		}

		t += direction * (speed * 0.001) * delta;
		t = Math.min(Math.max(t, 0), 1);

		const easedT = easingFn(t);

		const pos = easedT * maxScroll;
		span.style.transform = `translateX(${-pos}px)`;

		requestAnimationFrame(step);
	}

	requestAnimationFrame(step);

	button.updateText = (newText) => {
		span.textContent = newText;

		t = 0;
		direction = 1;
		pausedUntil = 0;
		span.style.transform = "translateX(0px)";
	};
}

var prBtn = document.getElementById("pullRequest");
async function fetchAllPRs(owner, repo, state = "open") {
	let page = 1;
	let results = [];
	const perPage = 100;

	while (true) {
		const res = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/pulls?per_page=${perPage}&state=${state}&page=${page}`
		);

		if (!res.ok) {
			throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
		}

		const data = await res.json();
		for (let pr of data)
			pr.isPr = true;
		results = results.concat(data);

		if (data.length < perPage) {
			break; // no more pages
		}
		page++;
	}

	return results;
	}

var hasCheckedPrs = false;
var selectedPR = null;
makeButtonClickable(prBtn, () => {
	if (selectedPR != null)
	{
		var url = "";
		if (selectedPR.isPr)
			url = `https://github.com/FunkinCrew/Funkin/pull/${selectedPR.number}`;
		else
			url = `https://github.com/FunkinCrew/Funkin/tree/${selectedPR.branch}`

		window.backendAPI.openPage(url);
	}
}, true);
makeButtonClickable(prBtn, async () => {
	makeButtonUnclickable("pullRequest");
	makeButtonUnclickable("platform");
	makeButtonUnclickable("startBuild");
	makeButtonUnclickable("changeDirectory");
	makeButtonUnclickable("settingsButton");

    makeElementVisible("prPopup");
    makeElementVisible("loadingPr")
    if (!hasCheckedPrs) {
        var prListLabel = document.getElementById("prList")
        var allPrs = await fetchAllPRs("FunkinCrew", "Funkin", "open");
        var prList = [
			{isPr: false, branch: "main", title: "Main Branch"},
			{isPr: false, branch: "develop", title: "Develop Branch"}
		];
		for (let pr of allPrs)
			prList.push(pr);
		for (let pullRequest of prList)
        {
            var text = `${pullRequest.title}`
			if (pullRequest.isPr) {
				if (pullRequest.draft)
					text = `[DRAFT] ${text}`
				text = `[#${pullRequest.number}] ${text}`;
			} else
				text = `[FunkinCrew:${pullRequest.branch}] ${text}`

            var label = document.createElement("span");
            label.classList.add("normalText");
            label.textContent = text;
            prListLabel.appendChild(label);
            makeButtonClickable(label, () => {
                selectedPR = pullRequest;
				var btnText = "";
				if (!selectedPR.isPr)
					btnText = `${selectedPR.title} | FunkinCrew:${selectedPR.branch}`;
				else
					btnText = `[#${selectedPR.number}] ${pullRequest.draft ? "[DRAFT] " : ""}${selectedPR.head.user.login}:${selectedPR.head.ref}`
				prBtn.updateText(btnText)
                makeElementInvisible("prPopup");
				makeButtonClickable("pullRequest");
				makeButtonClickable("platform");
				makeButtonClickable("startBuild");
				makeButtonClickable("changeDirectory")
				makeButtonClickable("settingsButton");
            });
        }
        hasCheckedPrs = true; //OMG TRUE
    }
    makeElementInvisible("loadingPr");
});

makeButtonClickable("prPopupClose", () => {
    makeElementInvisible("prPopup");
	makeButtonClickable("pullRequest");
	makeButtonClickable("platform");
	makeButtonClickable("startBuild");
	makeButtonClickable("changeDirectory");
	makeButtonClickable("settingsButton");
});
enableScrollingText(prBtn, 0.5, 3000, t => -Math.cos(Math.PI * t)/2 + 0.5); //sine in out easing cuz fuck yeah

//-- BUILD GAME PART --//
var startBuild = document.getElementById("startBuild");
makeButtonClickable(startBuild, () => {
    makeElementVisible("buildPopup");
	makeButtonUnclickable("pullRequest");
	makeButtonUnclickable("platform");
	makeButtonUnclickable("startBuild");
	makeButtonUnclickable("changeDirectory");
	makeButtonUnclickable("settingsButton");
})
makeButtonClickable("startBuildClose", () => {
    makeElementInvisible("buildPopup");
	makeButtonClickable("pullRequest");
	makeButtonClickable("platform");
	makeButtonClickable("startBuild");
	makeButtonClickable("changeDirectory");
	makeButtonClickable("settingsButton");
});
makeButtonClickable("startBuildConfirm", async () => {
	if (selectedPR == null)
		window.alert("Please select a pull request!");
	else {
		var buildCommands = getBuildCommands();
		var cwd = await window.storeAPI.get("funkinGitPath");
    	makeElementInvisible("buildPopup");
		startBuild.textContent = "Building...";
		for (const rawCommand of buildCommands) {
			var splitted = rawCommand.split(" ");
			var command = splitted[0];
			var args = splitted.slice(1);
			var id = `${command}_${args[0] ?? "noarg"}`.replace(/[^\w-]/g, "_");
			const cmd = window.backendAPI.runCommand(`${id}_${Date.now()}`, command, args, { cwd: cwd });

			cmd.onOutputChanged((data) => {
				console.log(data);
			});

			try {
				await cmd.start(); // wait for this step to finish
				console.log(`${id} finished!`);
			} catch (err) {
				console.log(`${id} failed!\n${err}`);
				if (!id.startsWith("git_")) //only stop if a non git command fails
					break; // stop if a step fails (shit can fail here idc) (hi git remotes)
			}
		}
		makeButtonClickable("pullRequest");
		makeButtonClickable("platform");
		makeButtonClickable("startBuild");
		startBuild.textContent = "Click to Build";
	}
})

function getBuildCommands() {
    var platform = allowedBuildPlatforms[platformIndex];
    var buildFlags = getBuildFlags();
    var commands = [];

	const hasRemote = selectedPR.isPr;

	if (hasRemote) {
		const remoteName = selectedPR.head.repo.owner.login;
		const repoUrl = selectedPR.head.repo.clone_url;
		const branchRef = selectedPR.head.ref;

		commands.push(`git remote add ${remoteName} ${repoUrl}`)
		commands.push(`git remote set-url ${remoteName} ${repoUrl}`);
		commands.push(`git fetch ${remoteName} ${branchRef}`);
		commands.push(`git switch -C ${branchRef}-${remoteName} ${remoteName}/${branchRef}`);
	} else {
		const branchRef = selectedPR.branch;

		commands.push(`git fetch --all`);
		commands.push(`git switch -C ${branchRef} origin/${branchRef}`);
	}
	// FGL is not a program to edit the game code its to compile it and test pull requests only
	commands.push(`git reset --hard HEAD`); // Incase new commits come in for the cur branch it resets the entire head to the new commits
	commands.push(`git submodule update --recursive`);
	commands.push(`hmm reinstall`) // Fixes missing libraries or missmatched library versions
	var cmdPrefix = window.backendAPI.platform === "win32" ? `start "" cmd /c "` : `bash -c "`;
	var cmdSuffix = `"`;
	//you cant have newgrounds on these cuz of the env
    commands.push(`${cmdPrefix}lime test ${platform.toLowerCase()} -release ${buildFlags.join(" ")}${cmdSuffix}`);

	console.log(commands);

    return commands;
}

function getBuildFlags(){
	var flagsArray = [
		// A list or forced flags for the compilation due variables being internal only
		"-DNO_FEATURE_NEWGROUND"
	];
	var allFlags = [
		["debugBuild", "GITHUB_BUILD"],
		["featureVideo", "FEATURE_VIDEO_PLAYBACK"],
		["featureGhost", "FEATURE_GHOST_TAPPING"],
		["featureDebugMenu", "FEATURE_DEBUG_MENU"],
		["featurePolymod", "FEATURE_POLYMOD_MODS"],
		["featureConsoleLogs", "FEATURE_LOG_TRACE"],
		["preloadAll", "PRELOAD_ALL"],
	];

	for (flag of allFlags)
	{
		var toggle = document.querySelector(`#${flag[0]} input`);
		flagsArray.push(`-D${!toggle.checked ? "NO_" : ""}${flag[1]}`)
	}
	return flagsArray;
}