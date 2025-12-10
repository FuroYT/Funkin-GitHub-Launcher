/**
 * Updates the background color and tint status
 * @param {boolean} enable - Whenever or not the background color is tinted
 * @param {number} colorHue - The hue in the HSV wheel to use
 */
globalThis.updateBgColor = (enable, colorHue) => {3
    if (enable)
        document.body.setAttribute("tinted", "");
    else
        document.body.removeAttribute("tinted");
    document.body.style.setProperty("--bgTintColor", colorHue);

    window.backendAPI.updateAccentColor(enable, colorHue);
}

/**
 * Removes an element by its ID.
 * @param {string} id - The ID of the element to remove.
 */
globalThis.removeFromID = (id) => {
    const el = document.getElementById(id);
    if (el?.parentNode) {
        el.parentNode.removeChild(el);
    }
};

/**
 * Makes an element visible again.
 * @param {string} id - The ID of the element to show.
 * @returns {HTMLElement | null} - The element if found, otherwise null.
 */
globalThis.makeElementVisible = (id) => {
    let el = document.getElementById(id);
    if (!el) el = document.getElementsByClassName(id)[0];
    if (el) el.style.display = "";
    return el;
};

/**
 * Makes an element invisble (yeah ik).
 * @param {string} id - The ID of the element to show.
 * @returns {HTMLElement | null} - The element if found, otherwise null.
 */
globalThis.makeElementInvisible = (id) => {
    let el = document.getElementById(id);
    if (!el) el = document.getElementsByClassName(id)[0];
    if (el) el.style.display = "none";
    return el;
};

/**
 * Makes a button clickable with a (sync or async) callback.
 * @param {HTMLElement} el - The element to make clickable.
 * @param {(this: HTMLElement, ev: PointerEvent) => any | Promise<any>} el - The click handler.
 * @param {boolean} rightClick - If the actions happens on a right click
 * @returns {HTMLElement | null} - The element if valid, otherwise null.
 */
globalThis.makeButtonClickable = (el, callback, rightClick) => {
    rightClick = rightClick ?? false;
    if (typeof(el) == "string")
    {
        var elName = el;
        el = document.getElementById(elName);
        if (!el) el = document.getElementsByClassName(elName)[0];
    }
    if (el) {
        if (!el.classList.contains("clickableText"))
            el.classList.add("clickableText");
        var eventFunc = (ev) => {
            if (!el.classList.contains("clickableText")) return;
            try {
                const result = callback.call(this, ev);

                if (result instanceof Promise) {
                    result.catch(err =>
                        console.error("Error in async click handler:", err)
                    );
                }
            } catch (err) {
                console.error("Error in click handler:", err);
            }
        }
        if (rightClick)
        {
            if (!el.hasContextEvent) {
                el.addEventListener("contextmenu", eventFunc);
            }
            el.hasContextEvent = true;
        } else {
            if (!el.hasClickEvent) {
                el.addEventListener("click", eventFunc);
            }
            el.hasClickEvent = true;
        }
    }
    return el;
};

/**
 * Makes a button unclickable temporarely.
 * @param {HTMLElement} el - The element to make clickable.
 * @returns {HTMLElement | null} - The element if valid, otherwise null.
 */
globalThis.makeButtonUnclickable = (el) => {
    if (typeof(el) == "string")
    {
        var elName = el;
        el = document.getElementById(elName);
        if (!el) el = document.getElementsByClassName(elName)[0];
    }

    if (el)
        el.classList.remove("clickableText");
    return el;
};

var curBgColor;
var doesTintColor;
if (sessionStorage.getItem("FGL_BackgroundTinted") == null)
{
    (async () => {
        curBgColor = await window.storeAPI.get("FGL_BackgroundColor");
        doesTintColor = await window.storeAPI.get("FGL_BackgroundTinted");

        sessionStorage.setItem("FGL_BackgroundColor", curBgColor);
        sessionStorage.setItem("FGL_BackgroundTinted", doesTintColor);
        updateBgColor(doesTintColor, curBgColor);
    })();
} else {
    curBgColor = sessionStorage.getItem("FGL_BackgroundColor");
    doesTintColor = sessionStorage.getItem("FGL_BackgroundTinted") === "true";
    updateBgColor(doesTintColor, curBgColor);
}