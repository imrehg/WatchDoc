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
};


GoogleDocs.prototype.numNewItems_;

/**
 * The polling interval for feed items in minutes.
 * @type {number}
 */
GoogleDocs.DEFAULT_POLLING_INTERVAL = 1;  // 5 minutes.

/**
 * The default number of feed items to be retrieved.
 * @type {number}
 */
GoogleDocs.DEFAULT_NUM_FEED_ITEMS = 10;


/**
 * The default number of feed items to be shown.
 * @type {number}
 */
GoogleDocs.DEFAULT_NUM_FEED_ITEMS_SHOWN = 20;


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
 * @return {Object} The configuration options.
 */
GoogleDocs.prototype.getOptions = function() {
  return this.options_;
};


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
  this.setVisualState();
  // this.getTheFeed_();
};

GoogleDocs.prototype.resetNumNewItems = function() {
  this.numNewItems_ = 0;
  this.setVisualState();
};

/**
 * Logs out the user.
 */
GoogleDocs.prototype.logout = function() {
  this.oauth_.clearTokens();
  this.setVisualState();
};

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
 * Starts polling for feed items.
 */
GoogleDocs.prototype.startPolling = function() {
    alert("Started Polling!");
};

GoogleDocs.META_URL = 'https://docs.google.com/feeds/default/private/full';

GoogleDocs.CHANGES_URL = 'https://docs.google.com/feeds/default/private/changes';

GoogleDocs.prototype.getTheFeed_ = function() {
  if (this.oauth_.hasToken()) {
      this.oauth_.sendSignedRequest(GoogleDocs.CHANGES_URL,
          Util.bind(this.onFeedReceived_, this) , {
            'parameters' : {
		'alt': 'json',
		'v' : 3,
		'inline': true,
		'start-index': 69000
            },
            // 'headers' : {
            //   'X-GData-Key': 'key=' + YouTube.YOUTUBE_API_KEY
            // }
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
  // alert(text);

  if (data && data['feed'] && data['feed']['entry']) {
    // this.numNewItems_ = 0;
    var feedItems = data['feed']['entry'];
    for (var i = 0; i < feedItems.length; ++i) {
      var feedItem = feedItems[i];
      var itemId = feedItem['id'] && feedItem['id']['$t'];
      if (!this.feedMap_[itemId] &&
	  !localStorage['rm-' + itemId] &&
	  (feedItem['gd$lastViewed']['$t'] < feedItem['updated']['$t'])) {
        this.feedItems_.push(feedItem);
        this.feedMap_[itemId] = {
          'item': feedItem,
          'removed': false
        };
        ++this.numNewItems_;
      }
    }
    this.sortItems_();
    this.setBadgeText_();
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
    var maxItemsToShow = this.options_['numFeedItemsShown'];
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
          if (count == maxItemsToShow) {
            break;
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
  // // Grab the metadata from the feed item.
  var itemId = feedItem['id']['$t'];
  // var videoId = feedItem['yt$videoid']['$t'];
  // var username = feedItem['author'][0]['name']['$t'];
  // var eventType = this.getEventType_(feedItem);
  // if (!eventType) {
  //   return null;
  // }

  var feedEntryTimestamp = feedItem['updated']['$t'];
  // var videoInfo = null;
  // var links = feedItem['link'];
  // for (var i = 0; i < links.length; ++i) {
  //   if (links[i].rel == YouTube.VIDEO_REL) {
  //     videoInfo = links[i]['entry'][0];
  //   }
  // }
  // var videoTitle = videoInfo && videoInfo['title'] && videoInfo['title']['$t'];
  // var videoTime = videoInfo && 
  //                 videoInfo['media$group'] &&
  //                 videoInfo['media$group']['yt$duration'] &&
  //                 videoInfo['media$group']['yt$duration']['seconds'];
  // var videoDescription = videoInfo &&
  //                        videoInfo['media$group'] &&
  //                        videoInfo['media$group']['media$description'] &&
  //                        videoInfo['media$group']['media$description']['$t'];
  // var videoAddedTime = videoInfo &&
  //                      videoInfo['published'] &&
  //                      videoInfo['published']['$t'];
  // var videoViewCount = videoInfo &&
  //                      videoInfo['yt$statistics'] &&
  //                      videoInfo['yt$statistics']['viewCount'];
  // var videoAuthorUsername = videoInfo &&
  //                           videoInfo['author'] &&
  //                           videoInfo['author'][0] &&
  //                           videoInfo['author'][0]['name'] &&
  //                           videoInfo['author'][0]['name']['$t'];

  // // Prepare the content for the basic DOM for the feed entry.
  // var userChannelUrl = Util.channelUrl(username);
  // var feedEntryTitle = chrome.i18n.getMessage('eventType_' + eventType,
  //                                             [userChannelUrl, username]);

    var feedEntryTitle = feedItem['title']['$t'];
  // // Build the basic DOM for the feed entry from the template.
  var domFeedEntry = template.cloneNode(true);
  // var actionIcon = Util.getFirstElementByClass(domFeedEntry,
  //                                              'feed-entry-action-icon');
  // Util.setCssClass(actionIcon,
  //                  'feed-entry-action-icon message-sprite ' + eventType);
  Util.setChildHTML(domFeedEntry, 'feed-entry-title-text', feedEntryTitle);
  Util.setChildHTML(domFeedEntry, 'feed-entry-timestamp',
                    '(' + Util.formatTimeSince(feedEntryTimestamp) + ')');

  var docUrl = '';
  for (var i = 0; i < feedItem['link'].length; ++i) {
      if (feedItem['link'][i]['rel'] == "alternate") {
	  docUrl = feedItem['link'][i]['href'];
      }
  }
  Util.setAnchorHref(domFeedEntry, 'docs-entry-link', docUrl);
  var modifiedBy = feedItem['gd$lastModifiedBy']['$t'];
  Util.setChildHTML(domFeedEntry, 'docs-entry-byuser', modifiedBy);

  // Util.setName(domFeedEntry, 'feed-entry-item-id', itemId);

  // if (videoInfo) {
  //   // Prepare the content for the video info for the feed entry.
  //   var videoUrl = Util.videoWatchUrl(videoId);
  //   var videoAuthorChannelUrl = Util.channelUrl(videoAuthorUsername);
  //   var videoThumbnailSrc = Util.thumbnailUrl(videoId);
  //   var formattedViewCount = Util.formatViewCount(videoViewCount);
  //   var viewCountText = chrome.i18n.getMessage('viewCount',
  //                                              [formattedViewCount]);

  //   // Build the video info DOM for the feed entry from the template.
  //   Util.setImageSrc(domFeedEntry, 'feed-entry-video-img', videoThumbnailSrc);
  //   Util.setAnchorHref(domFeedEntry, 'feed-entry-video-thumb', videoUrl);
  //   Util.setChildHTML(domFeedEntry, 'feed-entry-video-time',
  //                     Util.formatVideoLength(videoTime));
  //   Util.setAnchorHref(domFeedEntry, 'feed-entry-video-long-title-anchor',
  //                      videoUrl);
  //   Util.setChildHTML(domFeedEntry, 'feed-entry-video-long-title-anchor',
  //                     videoTitle);
  //   Util.setChildHTML(domFeedEntry, 'feed-entry-video-description',
  //                     videoDescription);
  //   Util.setChildHTML(domFeedEntry, 'feed-entry-video-added-time',
  //                     Util.formatTimeSince(videoAddedTime));
  //   Util.setChildHTML(domFeedEntry, 'feed-entry-video-num-views',
  //                     viewCountText);
  //   Util.setAnchorHref(domFeedEntry, 'feed-entry-video-from-username',
  //                      videoAuthorChannelUrl);
  //   Util.setChildHTML(domFeedEntry, 'feed-entry-video-from-username',
  //                     videoAuthorUsername);
  //   var videoInfoElement = Util.getFirstElementByClass(
  //       domFeedEntry,
  //       'feed-entry-video-cell-template');
  //   Util.setCssClass(videoInfoElement, 'feed-entry-video-cell');
  // }
  Util.setCssClass(domFeedEntry, 'feed-entry');
  return domFeedEntry;
};


GoogleDocs.prototype.setBadgeText_ = function() {
  if (this.oauth_.hasToken()) {
    var count = this.numNewItems_;
    // if (!this.countNewVideosOnly_()) {
    //   // Count everything we have. Old-style.
    //   count = 0;
    //   for (var i = 0; i < this.feedItems_.length; ++i) {
    //     if (this.shouldShowFeedItem_(this.feedItems_[i], this.options_)) {
    //       ++count;
    //     }
    //   }
    //   // No point in showing a count larger than the number of videos we show.
    //   count = Math.min(count, this.options_['numFeedItemsShown']);
    // }
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

Util.formatTimeSince = function(timeString) {
    return timeString;
}
// /**
//  * Formats a timestamp using numbers and words.
//  * @param {string} timeString The timestamp as reported by gdata as a string.
//  * @return {string} Formatted timestamp.
//  */
// Util.formatTimeSince = function(timeString) {
//   if (!timeString) {
//     return '';
//   }
//   var timeStringDate = new Date(timeString);
//   var currentDate = new Date();
//   var timeDiffSeconds = (currentDate.getTime() -
//                          timeStringDate.getTime()) / 1000;
//   var minutesAgo =  Math.floor(timeDiffSeconds / 60);
//   var secondsAgo = timeDiffSeconds - minutesAgo * 60;
//   var hoursAgo = Math.floor(minutesAgo / 60);
//   var daysAgo = Math.floor(hoursAgo / 24);
//   var weeksAgo = Math.floor(daysAgo / 7);
//   var monthsAgo = Math.floor(daysAgo / 30);
//   var yearsAgo = Math.floor(monthsAgo / 12);
//   var amount = 0;
//   var messageSingular = '';
//   var messagePlural = '';
//   var result = '';

//   if (yearsAgo) {
//     amount = yearsAgo;
//     messageSingular = chrome.i18n.getMessage('yearAgo');
//     messagePlural = chrome.i18n.getMessage('yearsAgo', [amount]);
//   } else if (monthsAgo) {
//     amount = monthsAgo;
//     messageSingular = chrome.i18n.getMessage('monthAgo');
//     messagePlural = chrome.i18n.getMessage('monthsAgo', [amount]);
//   } else if (weeksAgo) {
//     amount = weeksAgo;
//     messageSingular = chrome.i18n.getMessage('weekAgo');
//     messagePlural = chrome.i18n.getMessage('weeksAgo', [amount]);
//   } else if (daysAgo) {
//     amount = daysAgo;
//     messageSingular = chrome.i18n.getMessage('dayAgo');
//     messagePlural = chrome.i18n.getMessage('daysAgo', [amount]);
//   } else if (hoursAgo) {
//     amount = hoursAgo;
//     messageSingular = chrome.i18n.getMessage('hourAgo');
//     messagePlural = chrome.i18n.getMessage('hoursAgo', [amount]);
//   } else if (minutesAgo) {
//     amount = minutesAgo;
//     messageSingular = chrome.i18n.getMessage('minuteAgo');
//     messagePlural = chrome.i18n.getMessage('minutesAgo', [amount]);
//   } else if (secondsAgo) {
//     amount = secondsAgo;
//     messageSingular = chrome.i18n.getMessage('secondAgo');
//     messagePlural = chrome.i18n.getMessage('secondsAgo', [amount]);
//   } else {
//     amount = 1;
//     messageSingular = chrome.i18n.getMessage('secondAgo');
//     messagePlural = chrome.i18n.getMessage('secondsAgo', [amount]);
//   }

//   if (amount > 1) {
//     result = messagePlural;
//   } else {
//     result = messageSingular;
//   }
//   return result;
// };
