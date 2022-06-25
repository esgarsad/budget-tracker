// create variable to hold db connection
let db;

const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
     const db = event.target.result;
     db.createObjectStore('new_transaction', { autoIncrement: true });
};


request.onsuccess = function(event) {
  // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
  db = event.target.result;
    // check if app is online, if yes run checkDatabase() function to send all local db data to api
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {

    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const  budgetObjectStore = transaction.objectStore('new_transaction');

    budgetObjectStore.add(record);
}

function uploadTransaction() {
  // open a transaction on your pending db
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {

        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }

                    //  additional transactions
                    const transaction = db.transaction(['new_transaction'], 'readwrite');

                    // access the new_transaction object store
                    const budgetObjectStore = transaction.objectStore('new_transaction');

                    // clear all items in store
                    budgetObjectStore.clear();

                    console.log('Saved transactions have been submitted');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
}

window.addEventListener('online', uploadTransaction);