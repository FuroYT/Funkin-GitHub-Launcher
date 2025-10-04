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
makeButtonClickable(prBtn, async () => {
	makeButtonUnclickable("pullRequest");
	makeButtonUnclickable("platform");
	makeButtonUnclickable("startBuild");

    makeElementVisible("prPopup");
    makeElementVisible("loadingPr")
    if (!hasCheckedPrs) {
        var prList = document.getElementById("prList")
        var allPrs = await fetchAllPRs("FunkinCrew", "Funkin", "open");
        for (let pullRequest of allPrs)
        {
            var text = `${pullRequest.title}`
            if (pullRequest.draft)
                text = `[DRAFT] ${text}`
            text = `[#${pullRequest.number}] ${text}`;

            var label = document.createElement("span");
            label.classList.add("normalText");
            label.textContent = text;
            prList.appendChild(label);
            makeButtonClickable(label, () => {
                selectedPR = pullRequest;
                prBtn.updateText(`[#${selectedPR.number}] ${pullRequest.draft ? "[DRAFT] " : ""}${selectedPR.head.user.login}/${selectedPR.head.ref}`)
                makeElementInvisible("prPopup");
				makeButtonClickable("pullRequest");
				makeButtonClickable("platform");
				makeButtonClickable("startBuild");
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
});
enableScrollingText(prBtn, 0.5, 3000, t => -Math.cos(Math.PI * t)/2 + 0.5); //sine in out easing cuz fuck yeah

//-- BUILD GAME PART --//
var startBuild = document.getElementById("startBuild");
makeButtonClickable(startBuild, () => {
    makeElementVisible("buildPopup");
	makeButtonUnclickable("pullRequest");
	makeButtonUnclickable("platform");
	makeButtonUnclickable("startBuild");
})
makeButtonClickable("startBuildClose", () => {
    makeElementInvisible("buildPopup");
	makeButtonClickable("pullRequest");
	makeButtonClickable("platform");
	makeButtonClickable("startBuild");
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

    const remoteName = selectedPR.head.repo.owner.login;
    const repoUrl = selectedPR.head.repo.clone_url;
    const branchRef = selectedPR.head.ref;

	commands.push(`git remote add ${remoteName} ${repoUrl}`)
    commands.push(`git remote set-url ${remoteName} ${repoUrl}`);
    commands.push(`git fetch ${remoteName} ${branchRef}`);
    commands.push(`git switch -C ${branchRef}-${remoteName} ${remoteName}/${branchRef}`);
	commands.push(`git submodule update --recursive`);
	var cmdPrefix = window.backendAPI.platform === "win32" ? `start "" cmd /c "` : `bash -c "`;
	var cmdSuffix = `"`;
	//you cant have newgrounds on these cuz of the env
    commands.push(`${cmdPrefix}lime test ${platform.toLowerCase()} -release -DNO_FEATURE_NEWGROUNDS ${buildFlags.join(" ")}${cmdSuffix}`);

    return commands;
}

function getBuildFlags(){
	var flagsArray = [];
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