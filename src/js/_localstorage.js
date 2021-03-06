// Display

var storage = {};

/* Chrome storage */
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    storage.isChromeStorage = true;

    storage.getItem = function (key, callback) {
        chrome.storage.local.get(key, function (obj) {
            if (obj.hasOwnProperty(key)) {
                callback(obj[key]);
            } else {
                callback(null);
            }
        });
    };

    storage.setItem = function (key, value) {
        var obj = {};
        obj[key] = value;
        chrome.storage.local.set(obj, function () {});
    };

    storage.removeItem = function (key) {
        chrome.storage.local.remove(key);
    };

    storage.clear = function () {
        chrome.storage.local.clear();
    };
} else {

    /* Test for local storage */
    function lsTest () {
        var test = 'test';
        try {
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /* Use normal local storage */
    if (lsTest() === true) {
        storage.getItem = function (key, callback) {
            value = localStorage.getItem(key);
            callback(value);
        };

        storage.setItem = function (key, value) {
            localStorage.setItem(key, value);
        };

        storage.removeItem = function (key) {
            localStorage.removeItem(key);
        };

        storage.clear = function () {
            localStorage.clear();
        };
    }

    /* Use dummy functions */
    else {
        function noop () {}
        storage = {
            getItem: noop,
            setItem: noop,
            clear: noop,
            removeItem: noop,
            getAllKeys: noop,
        };
    }

}
