var gdocs = null;

function initialize() {
    var oauth = ChromeExOAuth.initBackgroundPage({
          'request_url'     :  'https://www.google.com/accounts/OAuthGetRequestToken',
          'authorize_url'   :  'https://www.google.com/accounts/OAuthAuthorizeToken',
          'access_url'      :  'https://www.google.com/accounts/OAuthGetAccessToken',
          'consumer_key'    :  'anonymous',
          'consumer_secret' :  'anonymous',
          'scope'           :  'https://docs.google.com/feeds/',
          'app_name'        :  'WatchDoc Google Docs Notification Chrome Extension'
        });
    gdocs = new GoogleDocs(oauth);
    gdocs.initialize();
    gdocs.startPolling();
}

addLoadEvent(initialize);