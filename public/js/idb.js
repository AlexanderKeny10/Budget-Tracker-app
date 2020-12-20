let db;
// connect to IndexDB database budget-tracker and set the version
const request = indexedDB.open('budget-tracker', 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('new_entry', { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;

    // check if app is online, if yes run uploadEntry() function to send all local db data to api
    if (navigator.onLine) {
        uploadEntry();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};

// This function executed when new budget entry is submited and there's no internet connection
function saveRecord(record) {
    const transaction = db.transaction(['new_entry'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_entry');
    budgetObjectStore.add(record);
}

function uploadEntry() {
    const transaction = db.transaction(['new_entry'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_entry');
    const getAll = budgetObjectStore.getAll();

    // If .getAll() execution is successful this function below will run
    getAll.onsuccess = function () {
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
                    const transaction = db.transaction(['new_entry'], 'readwrite');
                    const budgetObjectStore = transaction.objectStore('new_entry');
                    budgetObjectStore.clear();
                    alert('All offline transactions have posted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
    // Listens if app is coming back online
    window.addEventListener('online', uploadEntry);
};