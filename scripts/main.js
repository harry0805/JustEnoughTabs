function matchUrl(urlToCheck, domainToMatch) {
    // Normalize the inputs by removing protocols, trailing paths, and leading "www." if present
    const normalizedUrl = urlToCheck
        .replace(/^https?:\/\//, "") // remove http:// or https://
        .split("/")[0]              // take only the domain part (stop at first slash)
        .toLowerCase();

    const normalizedDomain = domainToMatch
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .toLowerCase();

    // If the end of normalizedUrl matches normalizedDomain, return true
    return normalizedUrl.endsWith(normalizedDomain);
}

function targetCurrentPage(event) {
    let link = event.target.closest("a");
    if (link) {
        link.target = "_self";
    }
}

function addListeners() {
    document.addEventListener("mouseover", targetCurrentPage);
    document.addEventListener("mousedown", targetCurrentPage);
}

async function checkRegistered(link) {
    let check = false;
    await chrome.storage.sync.get("links").then((items) => {
        for (i in items.links) {
            if (matchUrl(link, items.links[i])) {
                check = true;
                break;
            }
        }
    })
    return check;
}

async function main() {
    let current_location = window.location.href;
    if (await checkRegistered(current_location)) {
        addListeners();
        console.log('Preventing extra tabs!');
    } else {
        console.log('NOT preventing extra tabs!');
    }
}

main();