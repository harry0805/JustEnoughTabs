import { extractDomain, isValidLink } from "./utils.js";

// Elements
const domainList = document.getElementById('link-list');

const addNewButton = document.querySelector('#add-new');
const addNewDialog = document.querySelector('#add-dialog');
const editDialog = document.querySelector('#edit-dialog');
let currentlyEditing = null;

// Register dialog
if (!addNewDialog.showModal) {
    dialogPolyfill.registerDialog(addNewDialog);
}
if (!editDialog.showModal) {
    dialogPolyfill.registerDialog(editDialog);
}

// Load stored domains on startup
document.addEventListener('DOMContentLoaded', loadList);

// Setup event listeners
addNewButton.addEventListener('click', function () {
    addNewDialog.showModal();
});

document.querySelectorAll('.domain-input').forEach((element) => {
    element.addEventListener('blur', (event) => {
        validateInput(event.target.parentElement);
    });
});

document.querySelectorAll('.close-dialog').forEach((element) => {
    element.addEventListener('click', (event) => {
        closeDialog(event.target.closest('dialog'));
    });
});

document.getElementById('add-dialog-form').addEventListener('submit', function (event) {
    event.preventDefault();
    addDomain(event.target);
});

document.getElementById('edit-dialog-form').addEventListener('submit', function (event) {
    event.preventDefault();
    editDomain(event.target);
});


function loadList() {
    chrome.storage.sync.get({ domains: [] }, function (items) {

        items.domains.reverse().forEach(function (domain) {
            addDomainToList(domain);
        });
    });
}

function closeDialog(dialog) {
    dialog.querySelector('.domain-input').value = '';
    setInputError(dialog.querySelector('.input-div'), null);
    currentlyEditing = null;
    dialog.close();
}

function setInputError(inputDiv, errorMsg) {
    const msgElement = inputDiv.querySelector('.mdl-textfield__error')
    // Define the regex pattern for a valid domain
    if (errorMsg !== null) {
        // Display error message
        msgElement.textContent = errorMsg;
        msgElement.style.display = 'block';

        // Add MDL invalid class for visual feedback
        inputDiv.classList.add('is-invalid');
    } else {
        // Clear the error message if the domain is valid
        msgElement.textContent = '';

        // Remove MDL invalid class for visual feedback
        inputDiv.classList.remove('is-invalid');
    }
}

function validateInput(inputDiv) {
    const inputElement = inputDiv.querySelector('input');
    const isValid = isValidLink(inputElement.value);
    if (!isValid) {
        setInputError(inputElement.parentElement, 'Must be a valid domain');
    }
    return isValid;
}

function addDomainToList(domain) {
    const tr = document.createElement('tr');

    // Domain Cell
    const domainCell = document.createElement('td');
    domainCell.className = 'mdl-data-table__cell--non-numeric domain-value';
    domainCell.textContent = domain;

    // Actions Cell
    const actionsCell = document.createElement('td');

    // Edit Button
    const editButton = document.createElement('button');
    editButton.className = 'mdl-button mdl-js-button mdl-button--icon mdl-button--colored';
    editButton.innerHTML = '<i class="material-icons">edit</i>';
    editButton.addEventListener('click', (event) => {
        currentlyEditing = event.target.closest('tr');
        const originalDomain = currentlyEditing.querySelector('.domain-value').textContent;
        editDialog.querySelector('.domain-input').value = originalDomain;
        editDialog.showModal();
    });
    componentHandler.upgradeElement(editButton);

    // Delete Button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'mdl-button mdl-js-button mdl-button--icon mdl-button--colored';
    deleteButton.innerHTML = '<i class="material-icons">delete</i>';
    deleteButton.addEventListener('click', (event) => {
        const domain = event.target.closest('tr').querySelector('.domain-value').textContent;
        removeDomain(domain);
    });
    componentHandler.upgradeElement(deleteButton);

    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);

    tr.appendChild(domainCell);
    tr.appendChild(actionsCell);
    domainList.insertBefore(tr, domainList.firstChild)
    componentHandler.upgradeElement(tr);
}

function removeDomainFromList(domain) {
    // Get all the rows of the table
    const rows = domainList.getElementsByTagName('tr');

    // Convert HTMLCollection to an array to safely iterate over and modify
    const rowsArray = Array.from(rows);

    // Iterate over each row
    rowsArray.forEach(row => {
        // Get the domain cell (assuming it's the first cell in the row)
        const domainCell = row.getElementsByTagName('td')[0];

        // Check if the text content of the domain cell matches the domain
        if (domainCell && domainCell.textContent === domain) {
            // Remove the row from the table
            row.parentNode.removeChild(row);
        }
    });
}

function addDomain(formElement) {
    const inputDiv = formElement.querySelector('.input-div');
    if (!validateInput(inputDiv)) {
        return;
    }

    const domainValue = extractDomain(inputDiv.querySelector('input').value)
    chrome.storage.sync.get('domains').then((items) => {
        if (items.domains.includes(domainValue)) {
            setInputError(inputDiv, 'This domain is already in the list.');
            return;
        }

        items.domains.unshift(domainValue);
        chrome.storage.sync.set({ domains: items.domains }).then(() => {
            addDomainToList(domainValue);
            closeDialog(formElement.closest('dialog'));
        });
    })
}

function editDomain(formElement) {
    const originalDomain = currentlyEditing.querySelector('.domain-value').textContent;
    const inputDiv = formElement.querySelector('.input-div');
    if (!validateInput(inputDiv)) {
        return;
    }

    const domainValue = extractDomain(inputDiv.querySelector('input').value)
    if (originalDomain === domainValue) {
        setInputError(inputDiv, 'Please enter a different value.');
        return;
    }

    chrome.storage.sync.get('domains').then((items) => {
        if (items.domains.includes(domainValue)) {
            setInputError(inputDiv, 'This domain is already in the list.');
            return;
        }

        const index = items.domains.indexOf(originalDomain);
        items.domains[index] = domainValue;
        chrome.storage.sync.set({ domains: items.domains }).then(() => {
            currentlyEditing.querySelector('.domain-value').textContent = domainValue;
            closeDialog(formElement.closest('dialog'));
        });
    })
}

function removeDomain(domain) {
    chrome.storage.sync.get('domains').then((items) => {
        const index = items.domains.indexOf(domain);
        if (index > -1) {
            items.domains.splice(index, 1);
            chrome.storage.sync.set({ domains: items.domains }).then(() => {
                removeDomainFromList(domain);
            });
        }
    });
}
