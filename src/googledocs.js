/**
 * License: see https://github.com/imrehg/WatchDoc/blob/master/README.md
 */
/**
 * Original YouTube Feed Chrome extension license:
 *
 * Copyright 2010 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Slave Jovanovski (slave@google.com)
 *
 */


/**
 * Constructor for a GoogleDocs object.
 * @param {ChromeExOAuth} oauth The authentication object.
 */
GoogleDocs = function(oauth) {
  this.oauth_ = oauth;
  this.feedItems_ = [];
  this.feedMap_ = {};
  this.videoTab_ = null;
  this.options_ = {
    'pollingInterval': localStorage['pollingInterval'] &&
                       parseInt(localStorage['pollingInterval']) ||
                       GoogleDocs.DEFAULT_POLLING_INTERVAL,
    'numFeedItems': localStorage['numFeedItems'] &&
                    parseInt(localStorage['numFeedItems']) ||
                    GoogleDocs.DEFAULT_NUM_FEED_ITEMS,
    'numFeedItemsShown': localStorage['numFeedItemsShown'] &&
                         parseInt(localStorage['numFeedItemsShown']) ||
                         GoogleDocs.DEFAULT_NUM_FEED_ITEMS_SHOWN

  };
  this.numNewItems_ = 0;
  this.lastTimeStamp_ = 0;
  this.userEmail_ = localStorage['userEmail'] || null;
};


/**
 * The number of new items in the feed since user last checked the list of items
 * @type {number}
 */
GoogleDocs.prototype.numNewItems_;


/**
 * The polling interval for feed items in minutes.
 * @type {number}
 */
GoogleDocs.DEFAULT_POLLING_INTERVAL = 1;  // 1 minutes.


/**
 * The oauth object that handles authentication.
 * @type {ChromeExOAuth}
 */
GoogleDocs.prototype.oauth_;


/**
 * Personalized user configs.
 * @type {Object}
 */
GoogleDocs.prototype.options_;


/**
 * The id of the interval used for polling.
 * @type {number}
 */
GoogleDocs.prototype.pollingIntervalId_;


/**
 * @return {Object} The configuration options.
 */
GoogleDocs.prototype.getOptions = function() {
  return this.options_;
};


/**
 * Supported document types.
 * @type {Array.<String>}
 */
GoogleDocs.SUPPORTED_DOC_TYPES = [
    'document',
    'presentation',
    'spreadsheet',
    'form',
    'drawing',
    'collection',
    'pdf'
];


/**
 * Metadata feed URL
 * @type {String}
 */
GoogleDocs.METADATA_URL = 'https://docs.google.com/feeds/metadata/default';


/**
 * Document changes feed URL
 * @type {String}
 */
GoogleDocs.CHANGES_URL = 'https://docs.google.com/feeds/default/private/changes';


/**
 * Logs in the user.
 */
GoogleDocs.prototype.login = function() {
  this.oauth_.authorize(Util.bind(this.onAuthorized_, this));
};


/**
 * Executed when a user has been authorized.
 */
GoogleDocs.prototype.onAuthorized_ = function() {
  this.getMetadata();
  this.setVisualState();
};


/**
 * Reset the new item counter
 */
GoogleDocs.prototype.resetNumNewItems = function() {
  this.numNewItems_ = 0;
  this.setVisualState();
};


/**
 * Logs out the user.
 */
GoogleDocs.prototype.logout = function() {
  this.oauth_.clearTokens();
  this.clearData();
  this.setVisualState();
};


/**
 * Clears out the data related to a user so a new login can start fresh
 */
GoogleDocs.prototype.clearData = function() {
  this.feedItems_ = [];
  this.feedMap_ = {};
  this.numNewItems_ = 0;
  this.lastTimeStamp_ = 0;
  this.userEmail_ = null;
  localStorage.clear();
}


/**
 * @return {bool} Whether the user is logged in.
 */
GoogleDocs.prototype.isLoggedIn = function() {
  return this.oauth_.hasToken();
};


/**
 * Sets the objects visual state.
 */
GoogleDocs.prototype.setVisualState = function() {
  // this.setIcon_();
  this.setBadgeText_();
};


/**
 * Initializes a GoogleDocs object.
 */
GoogleDocs.prototype.initialize = function() {
  this.setVisualState();
  // chrome.tabs.onRemoved.addListener(Util.bind(this.onTabRemoved_, this));
};


/**
 * Get metadata feed
 */
GoogleDocs.prototype.getMetadata = function() {
  if (this.oauth_.hasToken()) {
      this.oauth_.sendSignedRequest(GoogleDocs.METADATA_URL,
				    Util.bind(this.receivedMetadata, this),
				    { 'parameters' : {
                                         'alt': 'json',
                                         'v' : 3,
                                         'inline': true
                                         }
                                     });
   }
}


/**
 * Executed when the metadata feed is received
 * @param {string} text The parsed text from the xhr.
 * @param {XmlHttpRequest} xhr The XmlHttpRequest that finished executing.
 */
GoogleDocs.prototype.receivedMetadata = function(text, xhr) {
  var data = JSON.parse(text);
  var email = data['entry']['author'][0]['email']['$t'] || '';
  this.setUserEmail(email);
  this.getTheFeed_();
}


/**
 * Set the user's email information
 * @param {string} email The user's email to set.
 */
GoogleDocs.prototype.setUserEmail = function(email) {
  localStorage['userEmail'] = email;
  this.userEmail_ = localStorage['userEmail'];
}


/**
 * Starts polling for feed items.
 */
GoogleDocs.prototype.startPolling = function() {
  this.getMetadata();
  if (this.pollingIntervalId_) {
    window.clearInterval(this.pollingIntervalId_);
  }
  this.getTheFeed_();
  this.pollingIntervalId_ = window.setInterval(
      Util.bind(this.getTheFeed_, this),
      this.options_['pollingInterval'] * 60000);
};

GoogleDocs.prototype.getTheFeed_ = function() {
  if (this.oauth_.hasToken() && this.userEmail_) {
      var nextTimeStamp = this.lastTimeStamp_ + 1;
      this.oauth_.sendSignedRequest(GoogleDocs.CHANGES_URL,
          Util.bind(this.onFeedReceived_, this) , {
            'parameters' : {
		'alt': 'json',
		'v' : 3,
		'inline': true,
		'start-index': nextTimeStamp
            }
	  });
  }
}

GoogleDocs.prototype.sortItems_ = function() {
  this.feedItems_.sort(this.sortFunction_);
};

/**
 * Sorting method for feed items.
 * @param {Object} a One feed item.
 * @param {Object} b Another feed item.
 */
GoogleDocs.prototype.sortFunction_ = function(a, b) {
  var dateA = new Date(a['updated']['$t']);
  var dateB = new Date(b['updated']['$t']);
  return dateB.getTime() - dateA.getTime();
};


GoogleDocs.prototype.onFeedReceived_ = function(text, xhr) { 
  var data = JSON.parse(text);
  console.log(text);

  if (data && data['feed'] && data['feed']['entry']) {
    var feedItems = data['feed']['entry'];
    for (var i = 0; i < feedItems.length; ++i) {
      var feedItem = feedItems[i];
      var itemId = feedItem['id'] && feedItem['id']['$t'];

      // These items need default value because sometimes they are missing
      var lastViewed = feedItem['gd$lastViewed'] && feedItem['gd$lastViewed']['$t'] || "2000-01-01T00:00:00.000Z";
      var lastUpdated = feedItem['updated'] && feedItem['updated']['$t'] || "2000-01-01T00:00:00.000Z";
      var modifiedBy = feedItem['gd$lastModifiedBy'] && feedItem['gd$lastModifiedBy']['email'] && feedItem['gd$lastModifiedBy']['email']['$t'] || 'unknown';

      if (this.feedMap_[itemId]) {
	  var oldUpdated = this.feedMap_[itemId]['item']['updated'] && this.feedMap_[itemId]['item']['updated']['$t'] || "2000-01-01T00:00:00.000Z";
	  // Remove document from the list if: 1) it's been updated and later we want to add new version to list, 2) has been viewed by user
          if ((oldUpdated < lastUpdated) ||
              (oldUpdated < lastViewed)) {
              // remove old version and add new one!
              this.feedItems_.splice(this.feedItems_.indexOf(this.feedMap_[itemId]['item']), 1);
	      delete this.feedMap_[itemId];
          }
      }

      // Strict critera for display items: not "remove changes", not in store already, not on "not-show list", hasn't been viewed, not self-modified"
      if (!feedItem['docs$removed'] &&
	  !this.feedMap_[itemId] &&
	  !localStorage['rm-' + itemId] &&
	  (lastViewed < lastUpdated) &&
	  (this.userEmail_ != modifiedBy)) {
        this.feedItems_.push(feedItem);
        this.feedMap_[itemId] = {
          'item': feedItem,
          'removed': false
        };
        ++this.numNewItems_;
      }
	this.lastTimeStamp_ = feedItem['docs$changestamp'] && parseInt(feedItem['docs$changestamp']['value']) || this.lastTimeStamp_;
    }
    this.sortItems_();
    this.setBadgeText_();

    var largestChangestamp = data['feed']['docs$largestChangestamp'] && parseInt(data['feed']['docs$largestChangestamp']['value']) || 0;
    // If haven't downloaded all changes yet, run the request again
    if (this.lastTimeStamp_ < largestChangestamp) {
       this.getTheFeed_();
    }
  }

}

GoogleDocs.prototype.shouldShowFeedItem_ = function(feedItem, prefs) {
    return true;
};

/**
 * @param {Element} feedEntryTemplate The feed entry template.
 * @return {Element} The DOM for the feed.
 */
GoogleDocs.prototype.buildFeedDom = function(feedEntryTemplate) {
  var div = document.createElement('div');
  var count = 0;
  if (!!this.feedItems_.length) {
    for (var i = 0; i < this.feedItems_.length; ++i) {
	// if (i == 0) {
	//     alert(JSON.stringify(this.feedItems_[i]));
        // }
      try {
        if (this.shouldShowFeedItem_(this.feedItems_[i], this.options_)) {
          var child = this.buildFeedItemElement_(feedEntryTemplate,
                                                 this.feedItems_[i]);
          if (child) {
            div.appendChild(child);
            ++count;
          }
        }
      } catch (e) {
        console.log('Exception ' + e);
      }
    }
  }

  if (count == 0) {
    var noItems = document.createElement('h2');
    noItems.innerHTML = chrome.i18n.getMessage('messageNoFeedItems');
    div.appendChild(noItems);
  }

  return div;
};


GoogleDocs.prototype.buildFeedItemElement_ = function(template, feedItem) {
  var itemId = feedItem['id']['$t'];
  var feedEntryTimestamp = feedItem['updated']['$t'];

  var feedEntryTitle = feedItem['title']['$t'];

  // Build the basic DOM for the feed entry from the template.
  var domFeedEntry = template.cloneNode(true);

  Util.setChildHTML(domFeedEntry, 'feed-entry-title-text', feedEntryTitle);
  Util.setChildHTML(domFeedEntry, 'feed-entry-timestamp',
                    '(' + Util.formatTimeSince(feedEntryTimestamp) + ')');

  var docUrl = '';
  for (var i = 0; i < feedItem['link'].length; ++i) {
      if (feedItem['link'][i]['rel'] == "alternate") {
	  docUrl = feedItem['link'][i]['href'];
      }
  }

  // Setup icon
  var actionIcon = Util.getFirstElementByClass(domFeedEntry,
                                               'feed-entry-action-icon');
  var docType = '';
  for (var i = 0; i < feedItem['category'].length; ++i) {
      if (feedItem['category'][i]['scheme'] == "http://schemas.google.com/g/2005#kind") {
	  docType = feedItem['category'][i]['label'];
	  break;
      }
  }
  if (GoogleDocs.SUPPORTED_DOC_TYPES.indexOf(docType) == -1) {
      docType = 'document';
  }
  Util.setCssClass(actionIcon,
                   'feed-entry-action-icon message-sprite ' + docType);


  Util.setAnchorHref(domFeedEntry, 'docs-entry-link', docUrl);
  var modifiedBy = feedItem['gd$lastModifiedBy'] && feedItem['gd$lastModifiedBy']['name'] && feedItem['gd$lastModifiedBy']['name']['$t'] || 'unknown';
  Util.setChildHTML(domFeedEntry, 'docs-entry-byuser', 'by ' + modifiedBy);

  Util.setCssClass(domFeedEntry, 'feed-entry');
  return domFeedEntry;
};


GoogleDocs.prototype.setBadgeText_ = function() {
  if (this.oauth_.hasToken()) {
    var count = this.numNewItems_;
    var displayedCount = count || '';
    chrome.browserAction.setBadgeText({'text': '' + displayedCount});
  } else {
    chrome.browserAction.setBadgeText({'text': ''});
  }
};


/**
 * Copied from Closure base.js.
 * @param {Function} fn The function to be bound.
 * @param {Object} selfObj The object to which *this* will point when fn will be
 *     executed.
 * @param {*} var_args Additional arguments that are partially applied to the
 *     function.
 */
Util = function() {};
Util.bind = function(fn, selfObj, var_args) {
  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };
  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};


Util.getFirstElementByClass = function(parent, cssClass) {
  var els = parent && parent.getElementsByClassName(cssClass);
  return els && els[0];
};

/**
 * Sets the html of the first child node with a specific css class.
 * @param {Element} parent The element which contains the child.
 * @param {string} childCssClass The css class of the child.
 * @param {string} html The html for the child.
 */
Util.setChildHTML = function(parent, childCssClass, html) {
  var el = Util.getFirstElementByClass(parent, childCssClass);
  if (el) {
    el.innerHTML = html;
  }
};

/**
 * Sets the source of a child img tag with a given class name.
 * @param {Element} parent The element which contains the child.
 * @param {string} childCssClass The css class of the child.
 * @param {string} imageSrc The image source.
 */
Util.setImageSrc = function(parent, childCssClass, imageSrc) {
  var el = Util.getFirstElementByClass(parent, childCssClass);
  if (el) {
    el.src = imageSrc;
  }
};

/**
 * Sets the href of an child anchor with a given class name.
 * @param {Element} parent The element which contains the child.
 * @param {string} childCssClass The css class of the child.
 * @param {string} imageSrc The image source.
 */
Util.setAnchorHref = function(parent, childCssClass, href) {
  var el = Util.getFirstElementByClass(parent, childCssClass);
  if (el) {
    el.href = href;
  }
};

Util.setCssClass = function(element, cssClassName) {
  element.className = cssClassName;
};


/**
 * Formats a timestamp using numbers and words.
 * @param {string} timeString The timestamp as reported by gdata as a string.
 * @return {string} Formatted timestamp.
 */
Util.formatTimeSince = function(timeString) {
  if (!timeString) {
    return '';
  }
  var timeStringDate = new Date(timeString);
  var currentDate = new Date();
  var timeDiffSeconds = (currentDate.getTime() -
                         timeStringDate.getTime()) / 1000;
  var minutesAgo =  Math.floor(timeDiffSeconds / 60);
  var secondsAgo = timeDiffSeconds - minutesAgo * 60;
  var hoursAgo = Math.floor(minutesAgo / 60);
  var daysAgo = Math.floor(hoursAgo / 24);
  var weeksAgo = Math.floor(daysAgo / 7);
  var monthsAgo = Math.floor(daysAgo / 30);
  var yearsAgo = Math.floor(monthsAgo / 12);
  var amount = 0;
  var messageSingular = '';
  var messagePlural = '';
  var result = '';

  if (yearsAgo) {
    amount = yearsAgo;
    messageSingular = chrome.i18n.getMessage('yearAgo');
    messagePlural = chrome.i18n.getMessage('yearsAgo', [amount]);
  } else if (monthsAgo) {
    amount = monthsAgo;
    messageSingular = chrome.i18n.getMessage('monthAgo');
    messagePlural = chrome.i18n.getMessage('monthsAgo', [amount]);
  } else if (weeksAgo) {
    amount = weeksAgo;
    messageSingular = chrome.i18n.getMessage('weekAgo');
    messagePlural = chrome.i18n.getMessage('weeksAgo', [amount]);
  } else if (daysAgo) {
    amount = daysAgo;
    messageSingular = chrome.i18n.getMessage('dayAgo');
    messagePlural = chrome.i18n.getMessage('daysAgo', [amount]);
  } else if (hoursAgo) {
    amount = hoursAgo;
    messageSingular = chrome.i18n.getMessage('hourAgo');
    messagePlural = chrome.i18n.getMessage('hoursAgo', [amount]);
  } else if (minutesAgo) {
    amount = minutesAgo;
    messageSingular = chrome.i18n.getMessage('minuteAgo');
    messagePlural = chrome.i18n.getMessage('minutesAgo', [amount]);
  } else {
      amount = 1;
      messageSingular = chrome.i18n.getMessage('justNow');
      messagePlural = chrome.i18n.getMessage('justNow');
  }

  if (amount > 1) {
    result = messagePlural;
  } else {
    result = messageSingular;
  }
  return result;
};


GoogleDocs.prototype.openInTab = function(url) {
    chrome.tabs.create({'url': url} );
};
