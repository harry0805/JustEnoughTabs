import { extractDomain } from "./utils.js";

const fullButton = document.querySelector('#full-button');
const fullButtonTooltip = document.querySelector('[data-mdl-for="full-button"]');
const secondLevelButton = document.querySelector('#second-level-button');
const secondLevelButtonTooltip = document.querySelector('[data-mdl-for="second-level-button"]');

const actionUnavailableStr = 'Action unavailable for current page';

async function getCurrentURL() {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    console.log(tab);
    return tab.url;
}

function getSecondLevelDomain(fullDomain) {
    const parts = fullDomain.split('.');
    if (parts.length > 2) {
        return parts.slice(-2).join('.');
    }
    return fullDomain;
}

async function refreshButtonState() {
    const currentURL = await getCurrentURL();

    if (!(currentURL.startsWith("http://") || currentURL.startsWith("https://"))) {
        fullButton.disabled = true;
        secondLevelButton.disabled = true;
        fullButtonTooltip.textContent = actionUnavailableStr;
        secondLevelButtonTooltip.textContent = actionUnavailableStr;
        return;
    }

    const domain = extractDomain(currentURL);
    const secondLevelDomain = getSecondLevelDomain(domain);
    const domainParts = domain.split('.');

    if (domainParts.length < 3) {
        fullButton.disabled = true;
        if (fullButtonTooltip) fullButtonTooltip.textContent = actionUnavailableStr;
    } else {
        fullButton.disabled = false;
    }

    chrome.storage.sync.get({ domains: [] }, ({ domains }) => {
        if (domains.includes(domain) && !fullButton.disabled) {
            fullButton.textContent = `Unblock ${domain}`;
            fullButton.classList.add('btn-red');
        } else {
            fullButton.textContent = `Block ${domain}`;
            fullButton.classList.remove('btn-red');
        }

        if (domains.includes(secondLevelDomain)) {
            secondLevelButton.textContent = `Unblock ${secondLevelDomain}`;
            secondLevelButton.classList.add('btn-red');

            fullButton.disabled = true;
            fullButtonTooltip.textContent = 'Domain already blocked';
        } else {
            secondLevelButton.textContent = `Block ${secondLevelDomain}`;
            secondLevelButton.classList.remove('btn-red');

            fullButtonTooltip.textContent = '';
        }

        secondLevelButtonTooltip.textContent = '';
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await refreshButtonState();
});

// Toggle blocked state for full domain
fullButton.addEventListener('click', async () => {
    const currentURL = await getCurrentURL();
    const domain = extractDomain(currentURL);
    chrome.storage.sync.get({ domains: [] }, items => {
        const domains = items.domains;
        if (domains.includes(domain)) {
            const newDomains = domains.filter(d => d !== domain);
            chrome.storage.sync.set({ domains: newDomains }, () => {
                refreshButtonState();
            });
        } else {
            domains.push(domain);
            chrome.storage.sync.set({ domains }, () => {
                refreshButtonState();
            });
        }
    });
});

// Toggle blocked state for second-level domain
secondLevelButton.addEventListener('click', async () => {
    const currentURL = await getCurrentURL();
    const domain = extractDomain(currentURL);
    const secondLevelDomain = getSecondLevelDomain(domain);
    chrome.storage.sync.get({ domains: [] }, ({ domains }) => {
        if (domains.includes(secondLevelDomain)) {
            const newDomains = domains.filter(d => d !== secondLevelDomain);
            chrome.storage.sync.set({ domains: newDomains }, () => {
                refreshButtonState();
            });
        } else {
            domains.push(secondLevelDomain);
            chrome.storage.sync.set({ domains }, () => {
                refreshButtonState();
            });
        }
    });
});