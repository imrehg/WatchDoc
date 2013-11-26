var gdocs = null;

function initialize() {
    chrome.identity.getAuthToken({ interactive: false }, function(token) {
	if (token) {
	    console.log("Token: "+token);
	    gdocs = new GoogleDocs(token);
	    gdocs.initialize();
	    gdocs.startPolling();
	} else {
	    console.log("Not logged in or cannot log in.")
	}
    });
}

addLoadEvent(initialize);
