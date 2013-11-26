// var googleDriveUserLoader = (function() {
//   var login_button;
//   var logout_button;
//   var logout_button_token;
//   var docsHomeLink;

//   var bkg = chrome.extension.getBackgroundPage();
//   var gdocs = bkg.gdocs;

//   function showButton(button) {
//     button.disabled = false;
//     button.style.display = 'inline';
//   }

//   function hideButton(button) {
//     button.style.display = 'none';
//   }

//   function disableButton(button) {
//     button.disabled = true;
//   }

//   function xhrWithAuth(method, url, interactive, callback) {
//     var retry = true;
//     var access_token;
//     getToken();

//     function getToken() {
//       chrome.identity.getAuthToken({ interactive: interactive }, function(token) {
//         if (chrome.runtime.lastError) {
//           callback(chrome.runtime.lastError);
//           return;
//         }

//         // Save the token globally for the revoke button.
//         logout_button_token = token;

//         access_token = token;
//         requestStart();
//       });
//     }

//     function requestStart() {
//       bkg.console.log('Request start');
//       // var xhr = new XMLHttpRequest();
//       // xhr.open(method, url);
//       // xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
//       // xhr.onload = requestComplete;
//       // xhr.send();
      
//     }

//     function requestComplete() {
//       if (this.status == 401 && retry) {
//         retry = false;
//         chrome.identity.removeCachedAuthToken({ token: access_token },
//                                               getToken);
//       } else {
//         callback(null, this.status, this.response);
//       }
//     }
//   }

//   function getUserInfo(interactive) {
//     xhrWithAuth('GET',
//                 'https://www.googleapis.com/plus/v1/people/me',
//                 interactive,
//                 onUserInfoFetched);
//   }

//   function displayFeed(token) {
//       logout_button.innerHTML = chrome.i18n.getMessage('buttonLogout');
//       logout_button.style.display = '';
//       gdocs.getTheFeed_();
//       var feedDom = document.getElementById('feed');
//       var feedEntryTemplate = document.getElementsByClassName('feed-entry-template')[0];
//       feedDom.innerHTML = gdocs.buildFeedDom(feedEntryTemplate).innerHTML;
      
//       var docTitles = document.getElementsByClassName('docs-entry-link');
      
//       for (var i = 0; i < docTitles.length; ++i) {
//           docTitles[i].addEventListener('mousedown', function(e) {
//               gdocs.openInTab(e.currentTarget.href);
// 	  });
//       }

//       // Create open all docs in new window link
//       var urls = [];
//       for (var key in gdocs.feedMap_) {
//           var thisUrl = gdocs.feedMap_[key]['url'];
//           if (thisUrl != '') {
//               urls.push(thisUrl);
//           }
//       }
//       var openAllLink = document.getElementById('docs-open-all-link');
//       if (urls.length > 0) {
//           openAllLink.innerHTML = chrome.i18n.getMessage('openAllLink');
//              openAllLink.addEventListener('mousedown', function(e) {
// 		chrome.windows.create({url: urls, focused: true});
// 	     });
//           docsHomeLink.style.display = 'block';
//       } else {
//           openAllLink.style.display = 'none';
//       }
//   }


//   // OnClick event handlers for the buttons.

//   function interactiveSignIn() {
//     disableButton(login_button);
//     chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
//       if (chrome.runtime.lastError) {
//         showButton(login_button);
//       } else {
//         getUserInfo(true);
//       }
//     });
//   }

//   // replace with removeCachedAuthToken()
//   function revokeToken() {
//     if (revoke_button_token) {
//       // Make a request to revoke token
//       var xhr = new XMLHttpRequest();
//       xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
//                logout_button_token);
//       xhr.send();
//       // Update the user interface accordingly
//       logout_button_token = null;
//       hideButton(logout_button);
//       showButton(login_button);
//     }
//   }

//   return {
//     onload: function () {
//       var titleText = chrome.i18n.getMessage('titleFeedPage');
//       var h1Title = document.getElementById('title');
//       h1Title.innerHTML = titleText;
//       document.title = titleText;

//       docsHomeLink = document.getElementById('docs-home-link');
//       docsHomeLink.addEventListener('mousedown', function(e) {
//             gdocs.openInTab(e.currentTarget.href);
//         });
//       var userEmail = gdocs.userEmail_ && "("+gdocs.userEmail_+")" || '';
//       docsHomeLink.innerHTML = chrome.i18n.getMessage('labelDocsHome')+'<br/>'+userEmail;
//       var openAllLink = document.getElementById('docs-open-all-link');

//       login_button = document.querySelector('button#login');
//       login_button.innerHTML = chrome.i18n.getMessage('buttonLogin');
//       login_button.onclick = interactiveSignIn;
//       showButton(login_button);

//       logout_button = document.querySelector('button#logout');
//       logout_button.innerHTML = chrome.i18n.getMessage('buttonLogout');
//       logout_button.onclick = revokeToken;
//       showButton(logout_button);

//       chrome.identity.getAuthToken({ interactive: false }, function(token) {
// 	 if (token) {
//             displayFeed(token);
// 	 }
//       });
//     }
//   };

// })();

// window.onload = googleDriveUserLoader.onload;


console.log(chrome.i18n.getMessage('buttonLogin'));

//addLoadEvent(googleDriveUserLoader.onload);









// function initialize() {
//         var bkg = chrome.extension.getBackgroundPage();
//         var gdocs = bkg.gdocs;
//         bkg.console.log(Util.getTime(gdocs)+' Show doclist window');
//         var loginButton = document.getElementById('login_button');
//         loginButton.addEventListener('mousedown', function () {
//           gdocs.login();
//         });
//         var logoutButton = document.getElementById('logout_button');
//         logoutButton.addEventListener('mousedown', function() {
//           gdocs.logout();
//           window.close();
//         });

//         var titleText = chrome.i18n.getMessage('titleFeedPage');
//         var h1Title = document.getElementById('title');
//         h1Title.innerHTML = titleText;
//         document.title = titleText;

//         var docsHomeLink = document.getElementById('docs-home-link');
//         docsHomeLink.addEventListener('mousedown', function(e) {
//               gdocs.openInTab(e.currentTarget.href);
//         });
//         var userEmail = gdocs.userEmail_ && "("+gdocs.userEmail_+")" || ''
//         docsHomeLink.innerHTML = chrome.i18n.getMessage('labelDocsHome')+'<br/>'+userEmail;
//         var openAllLink = document.getElementById('docs-open-all-link');

// //        if (gdocs.isLoggedIn()) {
//         if (gdocs.hasAccessToken()) {
//           logoutButton.innerHTML = chrome.i18n.getMessage('buttonLogout');
//           logoutButton.style.display = '';
//           gdocs.getTheFeed_();
//           var feedDom = document.getElementById('feed');
//           var feedEntryTemplate = document.getElementsByClassName('feed-entry-template')[0];
//           feedDom.innerHTML = gdocs.buildFeedDom(feedEntryTemplate).innerHTML;

//           var docTitles = document.getElementsByClassName('docs-entry-link');

//           for (var i = 0; i < docTitles.length; ++i) {
//             docTitles[i].addEventListener('mousedown', function(e) {
//               gdocs.openInTab(e.currentTarget.href);
//             });
//           }

// 	  // Create open all docs in new window link
//           var urls = [];
//           for (var key in gdocs.feedMap_) {
//              var thisUrl = gdocs.feedMap_[key]['url'];
//              if (thisUrl != '') {
//                urls.push(thisUrl);
//              }
//           }
//           var openAllLink = document.getElementById('docs-open-all-link');
//           if (urls.length > 0) {
//              openAllLink.innerHTML = chrome.i18n.getMessage('openAllLink');
//              openAllLink.addEventListener('mousedown', function(e) {
//                 chrome.windows.create({url: urls, focused: true});
//              });
//              docsHomeLink.style.display = 'block';
//           } else {
//              openAllLink.style.display = 'none';
//           }

//         } else {
//           loginButton.innerHTML = chrome.i18n.getMessage('buttonLogin');
//           loginButton.style.display = '';

//           docsHomeLink.style.display = 'none';
//           openAllLink.style.display = 'none';

//           var feedDom = document.getElementById('feed');
//           var needLoginH2 = document.createElement('h2');
//           needLoginH2.className = 'needLogin';
//           needLoginH2.innerHTML = chrome.i18n.getMessage('messageNeedLogin');
//           var needLoginDiv = document.createElement('div');
//           needLoginDiv.appendChild(needLoginH2);
//           feedDom.innerHTML = needLoginDiv.innerHTML;
//         }
//         gdocs.resetNumNewItems();
// }

// document.addEventListener('DOMContentLoaded', function () {

// document.querySelector('button#login_button').addEventListener('click', function() { chrome.identity.getAuthToken({ 'interactive': true }, function(token) {  alert(token); });});

// });


function initialize() {
    var bkg = chrome.extension.getBackgroundPage();
    var gdocs = bkg.gdocs;
    var console = bkg.console;

    console.log(Util.getTime(gdocs)+' Show doclist window');
//         var loginButton = document.getElementById('login_button');
//         loginButton.addEventListener('mousedown', function () {
//           gdocs.login();
//         });
//         var logoutButton = document.getElementById('logout_button');
//         logoutButton.addEventListener('mousedown', function() {
//           gdocs.logout();
//           window.close();
//         });

    // var titleText = chrome.i18n.getMessage('titleFeedPage');
    // var h1Title = document.getElementById('title');
    // h1Title.innerHTML = titleText;
    // document.title = titleText;

    if (gdocs.accessToken) {
        var feedDom = document.getElementById('feed');
        var feedEntryTemplate = document.getElementsByClassName('feed-entry-template')[0];
        feedDom.innerHTML = gdocs.buildFeedDom(feedEntryTemplate).innerHTML;

        var docTitles = document.getElementsByClassName('docs-entry-link');

	console.log(gdocs.feedItems_);
        for (var i = 0; i < docTitles.length; ++i) {
            docTitles[i].addEventListener('mousedown', function(e) {
		gdocs.openInTab(e.currentTarget.href);
	    });
        }
	
    }

//         var docsHomeLink = document.getElementById('docs-home-link');
//         docsHomeLink.addEventListener('mousedown', function(e) {
//               gdocs.openInTab(e.currentTarget.href);
//         });
//         var userEmail = gdocs.userEmail_ && "("+gdocs.userEmail_+")" || ''
//         docsHomeLink.innerHTML = chrome.i18n.getMessage('labelDocsHome')+'<br/>'+userEmail;
//         var openAllLink = document.getElementById('docs-open-all-link');

// //        if (gdocs.isLoggedIn()) {
//         if (gdocs.hasAccessToken()) {
//           logoutButton.innerHTML = chrome.i18n.getMessage('buttonLogout');
//           logoutButton.style.display = '';
//           gdocs.getTheFeed_();
//           var feedDom = document.getElementById('feed');
//           var feedEntryTemplate = document.getElementsByClassName('feed-entry-template')[0];
//           feedDom.innerHTML = gdocs.buildFeedDom(feedEntryTemplate).innerHTML;

//           var docTitles = document.getElementsByClassName('docs-entry-link');

//           for (var i = 0; i < docTitles.length; ++i) {
//             docTitles[i].addEventListener('mousedown', function(e) {
//               gdocs.openInTab(e.currentTarget.href);
//             });
//           }

// 	  // Create open all docs in new window link
//           var urls = [];
//           for (var key in gdocs.feedMap_) {
//              var thisUrl = gdocs.feedMap_[key]['url'];
//              if (thisUrl != '') {
//                urls.push(thisUrl);
//              }
//           }
//           var openAllLink = document.getElementById('docs-open-all-link');
//           if (urls.length > 0) {
//              openAllLink.innerHTML = chrome.i18n.getMessage('openAllLink');
//              openAllLink.addEventListener('mousedown', function(e) {
//                 chrome.windows.create({url: urls, focused: true});
//              });
//              docsHomeLink.style.display = 'block';
//           } else {
//              openAllLink.style.display = 'none';
//           }

//         } else {
//           loginButton.innerHTML = chrome.i18n.getMessage('buttonLogin');
//           loginButton.style.display = '';

//           docsHomeLink.style.display = 'none';
//           openAllLink.style.display = 'none';

//           var feedDom = document.getElementById('feed');
//           var needLoginH2 = document.createElement('h2');
//           needLoginH2.className = 'needLogin';
//           needLoginH2.innerHTML = chrome.i18n.getMessage('messageNeedLogin');
//           var needLoginDiv = document.createElement('div');
//           needLoginDiv.appendChild(needLoginH2);
//           feedDom.innerHTML = needLoginDiv.innerHTML;
//         }
//         gdocs.resetNumNewItems();
}

addLoadEvent(initialize);
