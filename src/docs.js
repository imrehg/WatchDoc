function initialize() {
        var bkg = chrome.extension.getBackgroundPage();
        var gdocs = bkg.gdocs;
        bkg.console.log(Util.getTime(gdocs)+' Show doclist window');
        var loginButton = document.getElementById('login_button');
        loginButton.addEventListener('mousedown', function () {
          gdocs.login();
        });
        var logoutButton = document.getElementById('logout_button');
        logoutButton.addEventListener('mousedown', function() {
          gdocs.logout();
          window.close();
        });

        var titleText = chrome.i18n.getMessage('titleFeedPage');
        var h1Title = document.getElementById('title');
        h1Title.innerHTML = titleText;
        document.title = titleText;

        var docsHomeLink = document.getElementById('docs-home-link');
        docsHomeLink.addEventListener('mousedown', function(e) {
              gdocs.openInTab(e.currentTarget.href);
        });
        var userEmail = gdocs.userEmail_ && "("+gdocs.userEmail_+")" || ''
        docsHomeLink.innerHTML = chrome.i18n.getMessage('labelDocsHome')+'<br/>'+userEmail;
        var openAllLink = document.getElementById('docs-open-all-link');

        if (gdocs.isLoggedIn()) {
          logoutButton.innerHTML = chrome.i18n.getMessage('buttonLogout');
          logoutButton.style.display = '';
          gdocs.getTheFeed_();
          var feedDom = document.getElementById('feed');
          var feedEntryTemplate = document.getElementsByClassName('feed-entry-template')[0];
          feedDom.innerHTML = gdocs.buildFeedDom(feedEntryTemplate).innerHTML;

          var docTitles = document.getElementsByClassName('docs-entry-link');

          for (var i = 0; i < docTitles.length; ++i) {
            docTitles[i].addEventListener('mousedown', function(e) {
              gdocs.openInTab(e.currentTarget.href);
            });
          }

	  // Create open all docs in new window link
          var urls = [];
          for (var key in gdocs.feedMap_) {
             var thisUrl = gdocs.feedMap_[key]['url'];
             if (thisUrl != '') {
               urls.push(thisUrl);
             }
          }
          var openAllLink = document.getElementById('docs-open-all-link');
          if (urls.length > 0) {
             openAllLink.innerHTML = chrome.i18n.getMessage('openAllLink');
             openAllLink.addEventListener('mousedown', function(e) {
                chrome.windows.create({url: urls, focused: true});
             });
             docsHomeLink.style.display = 'block';
          } else {
             openAllLink.style.display = 'none';
          }

        } else {
          loginButton.innerHTML = chrome.i18n.getMessage('buttonLogin');
          loginButton.style.display = '';

          docsHomeLink.style.display = 'none';
          openAllLink.style.display = 'none';

          var feedDom = document.getElementById('feed');
          var needLoginH2 = document.createElement('h2');
          needLoginH2.className = 'needLogin';
          needLoginH2.innerHTML = chrome.i18n.getMessage('messageNeedLogin');
          var needLoginDiv = document.createElement('div');
          needLoginDiv.appendChild(needLoginH2);
          feedDom.innerHTML = needLoginDiv.innerHTML;
        }
        gdocs.resetNumNewItems();
}

addLoadEvent(initialize);
