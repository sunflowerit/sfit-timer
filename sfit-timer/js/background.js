var online = "it is online";
console.log(online);
var TogglButton = {
    setBrowserAction: function (timer) {
        console.log(timer);
        if (timer) {
            var imagePath = {'19': 'img/icon_19.png', '38': 'img/icon_38.png'};
        } else {
            var imagePath = {'19': 'img/inactive_19.png', '38': 'img/inactive_19.png'};
        }
        chrome.browserAction.setIcon({
	      path: imagePath,
	    });
	    console.log("works");
    },
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    TogglButton.setBrowserAction(message.TimerActive);
});

