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
 * @returns {HTMLElement | null} - The element if valid, otherwise null.
 */
globalThis.makeButtonClickable = (el, callback) => {
    if (typeof(el) == "string")
    {
        var elName = el;
        el = document.getElementById(elName);
        if (!el) el = document.getElementsByClassName(elName)[0];
    }
    if (el) {
        el.classList.add("clickableText");
        if (!el.hasClickEvent) {
            el.addEventListener("click", function (ev) {
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
            });
        }
        el.hasClickEvent = true;
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