function extractDomain(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
    }
    return new URL(url).hostname;
}

function matchUrl(urlToCheck, domainToMatch) {
    urlToCheck = extractDomain(urlToCheck);
    return urlToCheck.endsWith(domainToMatch);
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
    await chrome.storage.sync.get("domains").then((items) => {
        for (i in items.domains) {
            if (matchUrl(link, items.domains[i])) {
                check = true;
                break;
            }
        }
    })
    return check;
}

async function main() {
    const current_location = window.location.href;
    if (await checkRegistered(current_location)) {
        addListeners();
        console.log('Preventing extra tabs!');
    } else {
        console.log('NOT preventing extra tabs!');
    }
}

chrome.storage.sync.onChanged.addListener(() => {
    main();
});

main();