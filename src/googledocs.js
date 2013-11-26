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

var DEBUG = false;

/**
 * Constructor for a GoogleDocs object.
 * @param {ChromeExOAuth} oauth The authentication object.
 */
GoogleDocs = function(token) {
  this.accessToken = token;
  this.feedItems_ = [];
  this.feedMap_ = {};
  this.options_ = {
    'pollingInterval': localStorage['pollingInterval'] &&
                       parseInt(localStorage['pollingInterval']) ||
                       GoogleDocs.DEFAULT_POLLING_INTERVAL,
    'numFeedItems': localStorage['numFeedItems'] &&
                    parseInt(localStorage['numFeedItems']) ||
                    GoogleDocs.DEFAULT_NUM_FEED_ITEMS,
    'numFeedItemsShown': localStorage['numFeedItemsShown'] &&
                         parseInt(localStorage['numFeedItemsShown']) ||
                         GoogleDocs.DEFAULT_NUM_FEED_ITEMS_SHOWN,
    'docs_generic' :  localStorage['docs_generic'] === undefined ||
                      localStorage['docs_generic'] === 'true' ||
                      false,
    'docs_document' :  localStorage['docs_document'] === undefined ||
                       localStorage['docs_document'] === 'true' ||
                       false,
    'docs_presentation' :  localStorage['docs_presentation'] === undefined ||
                           localStorage['docs_presentation'] === 'true' ||
                           false,
    'docs_spreadsheet' :  localStorage['docs_spreadsheet'] === undefined ||
                          localStorage['docs_spreadsheet'] === 'true' ||
                          false,
    'docs_drawing' :  localStorage['docs_drawing'] === undefined ||
                      localStorage['docs_drawing'] === 'true' ||
                      false,
    'docs_form' :  localStorage['docs_form'] === undefined ||
                   localStorage['docs_form'] === 'true' ||
                   false,
    'docs_collection' :  localStorage['docs_collection'] === undefined ||
                         localStorage['docs_collection'] === 'true' ||
                         false,
    'docs_pdf' :  localStorage['docs_pdf'] === undefined ||
                  localStorage['docs_pdf'] === 'true' ||
                  false,
    'docs_image' :  localStorage['docs_image'] === undefined ||
                   localStorage['docs_image'] === 'true' ||
                   false,
    'docs_powerpoint' :  localStorage['docs_powerpoint'] === undefined ||
                         localStorage['docs_powerpoint'] === 'true' ||
                         false,
    'docs_fusion' :  localStorage['docs_fusion'] === undefined ||
                         localStorage['docs_fusion'] === 'true' ||
                         false,
    'docs_word' :  localStorage['docs_word'] === undefined ||
                         localStorage['docs_word'] === 'true' ||
                         false,
    'show_desktop_notification' :  localStorage['show_desktop_notification'] === undefined ||
                                   localStorage['show_desktop_notification'] === 'true' ||
                                   false
  };
  this.numNewItems_ = 0;
  this.lastTimeStamp_ = 0;
  this.oldestNewItem_ = localStorage['oldestNewItem'] !== 'undefined' && localStorage['oldestNewItem'] || 0;
  this.userEmail_ = localStorage['userEmail'] || null;
  this.firstPoll = true;
  this.starttime = 0;

  this.retry_count = 0;  // seconds
};


/**
 * Saves the specified options in local storage.
 * @param {Object} options The key/value pairs of options.
 */
GoogleDocs.prototype.saveOptions = function(options) {
  for (var option in options) {
    this.options_[option] = options[option];
    localStorage[option] = options[option];
  }
};


/**
 * The number of new items in the feed since user last checked the list of items
 * @type {number}
 */
GoogleDocs.prototype.numNewItems_;


/**
 * @type {number}
 */
GoogleDocs.prototype.oldestNewItem_;


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
    'generic',
    'document',
    'presentation',
    'spreadsheet',
    'form',
    'drawing',
    'collection',
    'pdf',
    'image',
    'powerpoint',
    'fusion',
    'word'
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
GoogleDocs.CHANGES_URL = 'https://www.googleapis.com/drive/v2/changes';

/**
 * Logs in the user.
 */
GoogleDocs.prototype.login = function() {
  console.log(Util.getTime(this)+' Logging in.');
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
  this.accessToken = null;
  this.feedItems_ = [];
  this.feedMap_ = {};
  this.numNewItems_ = 0;
  this.lastTimeStamp_ = 0;
  this.oldestNewItem_ = 0;
  this.userEmail_ = null;
  this.firstPoll = true;
  localStorage.clear();
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
  this.starttime = Util.getTime();
  console.log(Util.getTime(this)+' starting all up');
  this.setVisualState();
  // chrome.tabs.onRemoved.addListener(Util.bind(this.onTabRemoved_, this));
};


/**
 * Get metadata feed
 */
GoogleDocs.prototype.getMetadata = function() {
  console.log(Util.getTime(this)+' Getting user metadata');
  // if (this.oauth_.hasToken()) {
  //     this.oauth_.sendSignedRequest(GoogleDocs.METADATA_URL,
  // 				    Util.bind(this.receivedMetadata, this),
  // 				    { 'parameters' : {
  //                                        'alt': 'json',
  //                                        'v' : 3,
  //                                        'inline': true
  //                                        }
  //                                    });
  //  }
  if (this.accessToken) {
      // var config = {
      //     params: {'q': "modifiedDate > '2013-11-20T12:00:00'"},
      //     headers: {
      //         'Authorization': 'Bearer ' + this.accessToken
      //     }
      // };

      // $.ajax({
      // 	  url: "https://www.googleapis.com/drive/v2/files",
      // 	  headers: config.headers,
      // 	  data: config.params,
      //     success : function(ret) { console.log(ret); },
      // 	  error: function(x,e){
      //        console.log("error occur");
      //     }
      // 	  });
      var config = {
          params: {'includeSubscribed': true, 'maxResults': 100, 'startChangeId': 420500 },
          headers: {
              'Authorization': 'Bearer ' + this.accessToken
          }
      };

      $.ajax({
	  url: GoogleDoc.CHANGES_URL,
	  headers: config.headers,
	  data: config.params,
          success : function(ret) { console.log(ret); },
	  error: function(x,e){
             console.log("error occur");
          }
	  });
  }
};


/**
 * Executed when the metadata feed is received
 * @param {string} text The parsed text from the xhr.
 * @param {XmlHttpRequest} xhr The XmlHttpRequest that finished executing.
 */
GoogleDocs.prototype.receivedMetadata = function(text, xhr) {
  console.log(Util.getTime(this)+' Received metadata');
  var data = JSON.parse(text);
  var email = data['entry']['author'][0]['email']['$t'] || '';
  this.setUserEmail(email);
  this.getTheFeed_();
};


/**
 * Set the user's email information
 * @param {string} email The user's email to set.
 */
GoogleDocs.prototype.setUserEmail = function(email) {
  localStorage['userEmail'] = email;
  this.userEmail_ = localStorage['userEmail'];
};


/**
 * Starts polling for feed items.
 */
GoogleDocs.prototype.startPolling = function() {
  this.getTheFeed_(this.oldestNewItem_);
  // this.getMetadata();
  // if (this.pollingIntervalId_) {
  //   window.clearInterval(this.pollingIntervalId_);
  // }
  // this.pollingIntervalId_ = window.setInterval(
  //     Util.bind(this.getTheFeed_, this),
  //     this.options_['pollingInterval'] * 60000);
};

GoogleDocs.prototype.getTheFeed_ = function(startChangeId) {
    console.log(Util.getTime(this)+' Trying to get the feed.');

    if (!startChangeId) {
	startChangeId = this.lastTimeStamp_ + 1;
	startChangeId = startChangeId.toString();
    }
    console.log(startChangeId);

    var self = this;
    chrome.identity.getAuthToken({ interactive: false }, function(token) {
      if (token) {
	  self.accessToken = token;
	  console.log(Util.getTime(self)+' Good credentials, sending request.');
	  var config = {
              params: {'includeSubscribed': true, 'maxResults': 50, 'startChangeId': startChangeId},
              headers: {
		  'Authorization': 'Bearer ' + token
              }
	  };
	  $.ajax({
	      url: GoogleDocs.CHANGES_URL,
	      headers: config.headers,
	      data: config.params,
              success : function(data, status, xhr) { 
		  self.retry_count = 0;
		  self.onFeedReceived(data)
	      },
	      error: function(x,e){
		  console.log("Pull error occur, try #"+self.retry_count);
		  // retry with increasing intervals
		  window.setTimeout(
		      Util.bind(self.getTheFeed_(startChangeId), self),
		      5000 * Math.pow(2, self.retry_count)
		  );
		  self.retry_count++;
              }
	  });
      } else {
	  console.log("Not logged in or cannot log in.")
      }
  });

  // if (this.oauth_.hasToken() && this.userEmail_) {
  //     console.log(Util.getTime(this)+' Good credentials and email, sending request.');
  //     var nextTimeStamp = this.lastTimeStamp_ + 1;
  //     // If the oldest item is newer than that, don't have to look back
  //     if (this.oldestNewItem_ > nextTimeStamp) {
  // 	  nextTimeStamp = this.oldestNewItem_;
  //         // If starting in the begninning then zero oldestNewItem info out so we can renew it
  //         if (this.lastTimeStamp_ == 0) {
  // 	     this.oldestNewItem_ = 0;
  // 	  }
  //     }
  //     this.oauth_.sendSignedRequest(GoogleDocs.CHANGES_URL,
  //         Util.bind(this.onFeedReceived_, this) , {
  //           'parameters' : {
  // 		'alt': 'json',
  // 		'v' : 3,
  // 		'inline': true,
  // 		'start-index': nextTimeStamp
  //           }
  // 	  });
  // }
};

GoogleDocs.prototype.sortItems_ = function() {
  this.feedItems_.sort(this.sortFunction_);
};

/**
 * Sorting method for feed items.
 * @param {Object} a One feed item.
 * @param {Object} b Another feed item.
 */
GoogleDocs.prototype.sortFunction_ = function(a, b) {
  return b.changeId - a.changeId;
};

GoogleDocs.prototype.onFeedReceived = function(data) { 
    console.log(data);
    var largestChangeId = data.largestChangeId;
    var nextPageToken = data.nextPageToken;

    // var display = 0;
    // var nondisplay = 0;

    var changeList = [];

    for (var i = 0; i < data.items.length; i++) {
	var item = data.items[i];
	var itemId = item.fileId;
	var changeId = parseInt(item.id);

	if (this.feedMap_[itemId]) {
	    var olditem = this.feedMap_[itemId]
	    if (olditem.changeId < changeId) {

		// remove from the list because we'll reinsert it later as updated
		var itemIndex = this.feedItems_.indexOf(this.feedMap_[itemId])
		if (itemIndex >= 0) {
		    this.feedItems_.splice(itemIndex, 1);
		}
		
		file = item.file;
		if (file) {
		    this.feedMap_[itemId] = {
			'file': file,
			'removed': false,
			'url': file.alternateLink,
			'changeId' : changeId
		    };
		    changeList.push(itemId);
		    console.log("Updated item: +" + file.title);
		} else {
		    delete this.feedMap_[itemId];
		    console.log("Deleted old item: +" + olditem.file.title);
		}
	    } else {
		console.log("Existing unchanged item: " + item.file.title);
	    }
	} else {
	    if (item.file) {
		var file = item.file
		console.log("New item: " + file.title);
		this.feedMap_[itemId] = {
		    'file': file,
		    'removed': false,
		    'url': file.alternateLink,
		    'changeId' : changeId
		};
		changeList.push(itemId);
	    }
	}

	// Update how far we have seen the change list
	if (changeId > this.lastTimeStamp_) {
	    this.lastTimeStamp_ = changeId;
	}

    }

    for (var i = 0; i < changeList.length; i++) {
	var fileId = changeList[i]
	var item = this.feedMap_[fileId];
	var file = item.file;
	var lastViewedByMeDate = file.lastViewedByMeDate;
	var modifiedDate = file.modifiedDate;

	if ((modifiedDate > lastViewedByMeDate) && !file.lastModifyingUser.isAuthenticatedUser) {
	    console.log("Genuine change! "+file.title);

            // Only show desktop notification if the user wants it
            if (this.options_['show_desktop_notification'] && !this.firstPoll) {
		// no notifications at this point, need to update to the new chrome.notifications API
	    }

	    this.feedItems_.push(item);
	}
    }
    this.sortItems_();

//     for (var i = 0; i < data.items.length; i++) {
// 	var item = data.items[i];
// 	var itemId = item.fileId;

// 	if (!item.deleted) {
// 	    var file = item.file;
// 	    var lastViewedByMeDate = file.lastViewedByMeDate;
// 	    var modifiedDate = file.modifiedDate;

// 	    // if ((modifiedDate > lastViewedByMeDate) && !file.lastModifyingUser.isAuthenticatedUser) {
// 	    // 	console.log(file.lastModifyingUserName + ' -> ' + file.title + ' ? ' + file.lastModifyingUser.isAuthenticatedUser);
// 	    // 	console.log(lastViewedByMeDate, modifiedDate);

// 	    if (this.feedMap_[itemId]) {
// 		var oldUpdated = this.feedMap_[itemId]['modifiedDate'];

// 		// Remove document from the list if:
// 		// 1) it's been updated and later we want to add new version to list
// 		// 2) has been viewed by user
// 		if ((oldUpdated < modifiedDate) || (oldUpdated < lastViewedByMeDate)) {
// 		    this.feedItems_.splice(this.feedItems_.indexOf(this.feedMap_[itemId]), 1);
// 		    delete this.feedMap_[itemId];
// 		} else {
// 		    // Do not update just replace items
// 		    this.feedItems_[this.feedItems_.indexOf(this.feedMap_[itemId])] = file;
// 		    this.feedMap_[itemId] = file;
// 		    // var thisTime = modifiedDate || this.lastTimeStamp_;
// 		    // if (thisTime > this.lastTimeStamp_) {
// 		    // 	this.lastTimeStamp_ = thisTime;
// 		    // }
// 		} 
// 	    }

// //       // Strict critera for display items: not "remove changes", not in store already, not on "not-show list", hasn't been viewed, not self-modified"
// //       if (!this.feedMap_[itemId] &&
// //           !feedItem['docs$removed'] &&
// // 	  !deletedFile &&
// // 	  !localStorage['rm-' + itemId] &&
// // 	  (lastViewed < lastUpdated) &&
// // 	  (this.userEmail_ != modifiedBy)) {
// //         this.feedItems_.push(feedItem);

// //         // Find document URL
// //         var docUrl = '';
// //         for (var k = 0; k < feedItem['link'].length; ++k) {
// //           if (feedItem['link'][k]['rel'] == "alternate") {
// //             docUrl = feedItem['link'][k]['href'];
// //             break;
// //           }
// //         }
// //         this.feedMap_[itemId] = {
// //           'item': feedItem,
// //           'removed': false,
// //           'url': docUrl
// //         };

// //         if (this.shouldShowFeedItem_(feedItem, this.options_)) {
// //           ++this.numNewItems_;

// //           // Looks like the user email addresses have @ replaced by %, so it is better to change it back
// // 	  var hasModifierName = feedItem['gd$lastModifiedBy'] && feedItem['gd$lastModifiedBy']['name'] || false;
// // 	  if (hasModifierName) {
// // 	      feedItem['gd$lastModifiedBy']['name']['$t'] = feedItem['gd$lastModifiedBy']['name']['$t'].replace('%', '@');
// // 	  }

// //           // Only show desktop notification if the user wants it
// //           if (this.options_['show_desktop_notification'] && !this.firstPoll) {
// //             // Assemble data needed for desktop notification
// //             var notifData = {
// //                title: feedItem['title']['$t'],
// //                timestamp: Util.formatTimeSince(feedItem['updated']['$t']),
// //                doctype: this.extractDocType(feedItem),
// //                modifiedBy: feedItem['gd$lastModifiedBy'] && feedItem['gd$lastModifiedBy']['name'] && feedItem['gd$lastModifiedBy']['name']['$t'] || 'unknown',
// //               docUrl: docUrl,
// //               timeout: 10
// //             };
// //             var notification = webkitNotifications.createHTMLNotification(
// //               'notification.html?'+Util.serialize(notifData)
// //             );
// //             notification.show();
// // 	  }
// //           var changeStamp = feedItem['docs$changestamp'] && parseInt(feedItem['docs$changestamp']['value']) || -1;
// //           this.setOldestNewItem(changeStamp);
// //         }
// //           display = display + 1;
// //       } else {
// // 	  nondisplay = nondisplay + 1;
// //       }
// // 	this.lastTimeStamp_ = feedItem['docs$changestamp'] && parseInt(feedItem['docs$changestamp']['value']) || this.lastTimeStamp_;
// //     }
// //     console.log(Util.getTime(this)+ ' Went through all: '+display+'/'+nondisplay);
// //     this.sortItems_();
// //     console.log(Util.getTime(this)+ ' Sorted, ready to show');
// //     this.setBadgeText_();

// //     var largestChangestamp = data['feed']['docs$largestChangestamp'] && parseInt(data['feed']['docs$largestChangestamp']['value']) || 0;
// //     // If haven't downloaded all changes yet, run the request again
// //     if (this.lastTimeStamp_ < largestChangestamp) {
// //        this.getTheFeed_();
// //        console.log(Util.getTime(this)+' Checked up to changestamp '+this.lastTimeStamp_+'; largest changestamp: '+largestChangestamp);
// //     } else {
// //        // finished getting all the items
// //        this.setOldestNewItem(this.lastTimeStamp_);
// //        this.firstPoll = false;
// //        console.log(Util.getTime(this)+' finished getting feed items, should be displaying '+this.feedItems_.length+'; largest changestamp: '+largestChangestamp);
// //     }

// 	    }
// 	} else {  // if deleted item
// 	    if (this.feedMap_[itemId]) {
// 		this.feedItems_.splice(this.feedItems_.indexOf(this.feedMap_[itemId]['item']), 1);
//  		delete this.feedMap_[itemId];
// 	    }
// 	}
//     }

    if (nextPageToken) {
	this.getTheFeed_(nextPageToken);
    } else {
	console.log('pull finished :)');

	// Schedule the next update
	this.pollingIntervalId_ = window.setTimeout(
	    Util.bind(this.getTheFeed_, this),
	    this.options_['pollingInterval'] * 60000);

    }
}

// GoogleDocs.prototype.onFeedReceived_ = function(text, xhr) { 
//   var data = JSON.parse(text);
//   console.log(Util.getTime(this)+' Feed received');

//   if (data && data['feed'] && data['feed']['entry'] && this.userEmail_ != null) {
//     var feedItems = data['feed']['entry'];
//     console.log(Util.getTime(this)+' Number of items: '+feedItems.length);
//     console.log(Util.getTime(this)+' Changestamp of first item: '+ feedItems[0]['docs$changestamp']['value']);
//     var display = 0;
//     var nondisplay = 0;
//     for (var i = 0; i < feedItems.length; ++i) {
//       var feedItem = feedItems[i];
//       var itemId = feedItem['id'] && feedItem['id']['$t'];

//       // These items need default value because sometimes they are missing
//       var lastViewed = feedItem['gd$lastViewed'] && feedItem['gd$lastViewed']['$t'] || "2000-01-01T00:00:00.000Z";
//       var lastUpdated = feedItem['updated'] && feedItem['updated']['$t'] || "2000-01-01T00:00:00.000Z";
//       var modifiedBy = feedItem['gd$lastModifiedBy'] && feedItem['gd$lastModifiedBy']['email'] && feedItem['gd$lastModifiedBy']['email']['$t'] || 'unknown';
//       var deletedFile = feedItem['gd$deleted'] && true || false;

//       if (this.feedMap_[itemId]) {

//           if (DEBUG) {
//              var o1 = JSON.stringify(this.feedMap_[itemId]['item']);
//              console.log('OLD----->');
//              console.log(o1);
//              var o2 = JSON.stringify(feedItem);
//              console.log('NEW----->');
//              console.log(o2);
// 	  }

// 	  var oldUpdated = this.feedMap_[itemId]['item']['updated'] && this.feedMap_[itemId]['item']['updated']['$t'] || "2000-01-01T00:00:00.000Z";
// 	  // Remove document from the list if: 1) it's been updated and later we want to add new version to list, 2) has been viewed by user
//           if ((oldUpdated < lastUpdated) ||
//               (oldUpdated < lastViewed)) {
//               // remove old version, if everything's well the new version will be added in the next step!
//               this.feedItems_.splice(this.feedItems_.indexOf(this.feedMap_[itemId]['item']), 1);
// 	      delete this.feedMap_[itemId];
//               console.log(Util.getTime(this)+' Removed previous item from list because of new update to it');
//           } else {
//               // Do not update just replace items
//               this.feedItems_[this.feedItems_.indexOf(this.feedMap_[itemId]['item'])] = feedItem;
//               this.feedMap_[itemId]['item'] = feedItem;
//               var thisTime = feedItem['docs$changestamp'] && parseInt(feedItem['docs$changestamp']['value']) || this.lastTimeStamp_;
//               if (thisTime > this.lastTimeStamp_) {
// 		  this.lastTimeStamp_ = thisTime;
// 	      }
//               console.log(Util.getTime(this)+' Version already exist, replaced');
// 	  }
//       }

//       // Strict critera for display items: not "remove changes", not in store already, not on "not-show list", hasn't been viewed, not self-modified"
//       if (!this.feedMap_[itemId] &&
//           !feedItem['docs$removed'] &&
// 	  !deletedFile &&
// 	  !localStorage['rm-' + itemId] &&
// 	  (lastViewed < lastUpdated) &&
// 	  (this.userEmail_ != modifiedBy)) {
//         this.feedItems_.push(feedItem);

//         // Find document URL
//         var docUrl = '';
//         for (var k = 0; k < feedItem['link'].length; ++k) {
//           if (feedItem['link'][k]['rel'] == "alternate") {
//             docUrl = feedItem['link'][k]['href'];
//             break;
//           }
//         }
//         this.feedMap_[itemId] = {
//           'item': feedItem,
//           'removed': false,
//           'url': docUrl
//         };

//         if (this.shouldShowFeedItem_(feedItem, this.options_)) {
//           ++this.numNewItems_;

//           // Looks like the user email addresses have @ replaced by %, so it is better to change it back
// 	  var hasModifierName = feedItem['gd$lastModifiedBy'] && feedItem['gd$lastModifiedBy']['name'] || false;
// 	  if (hasModifierName) {
// 	      feedItem['gd$lastModifiedBy']['name']['$t'] = feedItem['gd$lastModifiedBy']['name']['$t'].replace('%', '@');
// 	  }

//           // Only show desktop notification if the user wants it
//           if (this.options_['show_desktop_notification'] && !this.firstPoll) {
//             // Assemble data needed for desktop notification
//             var notifData = {
//                title: feedItem['title']['$t'],
//                timestamp: Util.formatTimeSince(feedItem['updated']['$t']),
//                doctype: this.extractDocType(feedItem),
//                modifiedBy: feedItem['gd$lastModifiedBy'] && feedItem['gd$lastModifiedBy']['name'] && feedItem['gd$lastModifiedBy']['name']['$t'] || 'unknown',
//               docUrl: docUrl,
//               timeout: 10
//             };
//             var notification = webkitNotifications.createHTMLNotification(
//               'notification.html?'+Util.serialize(notifData)
//             );
//             notification.show();
// 	  }
//           var changeStamp = feedItem['docs$changestamp'] && parseInt(feedItem['docs$changestamp']['value']) || -1;
//           this.setOldestNewItem(changeStamp);
//         }
//           display = display + 1;
//       } else {
// 	  nondisplay = nondisplay + 1;
//       }
// 	this.lastTimeStamp_ = feedItem['docs$changestamp'] && parseInt(feedItem['docs$changestamp']['value']) || this.lastTimeStamp_;
//     }
//     console.log(Util.getTime(this)+ ' Went through all: '+display+'/'+nondisplay);
//     this.sortItems_();
//     console.log(Util.getTime(this)+ ' Sorted, ready to show');
//     this.setBadgeText_();

//     var largestChangestamp = data['feed']['docs$largestChangestamp'] && parseInt(data['feed']['docs$largestChangestamp']['value']) || 0;
//     // If haven't downloaded all changes yet, run the request again
//     if (this.lastTimeStamp_ < largestChangestamp) {
//        this.getTheFeed_();
//        console.log(Util.getTime(this)+' Checked up to changestamp '+this.lastTimeStamp_+'; largest changestamp: '+largestChangestamp);
//     } else {
//        // finished getting all the items
//        this.setOldestNewItem(this.lastTimeStamp_);
//        this.firstPoll = false;
//        console.log(Util.getTime(this)+' finished getting feed items, should be displaying '+this.feedItems_.length+'; largest changestamp: '+largestChangestamp);
//     }
//   }

// };


/**
 * Check and set the oldest new item value if it does not exist yet or if older than previously
 * @param {number} changeStamp the change timestamp that is attempted to change
 */
GoogleDocs.prototype.setOldestNewItem = function(changeStamp) {
    if ((this.oldestNewItem_ < 1) ||
	(changeStamp < this.oldestNewItem_)) {
       console.log(Util.getTime(this)+' set oldest new item timestamp: '+this.oldestNewItem_+'->'+changeStamp);
       this.oldestNewItem_ = changeStamp;
       localStorage['oldestNewItem'] = changeStamp;
    }
};


/**
 * Our logic to select which feed items to show, based on settings
 * @param {Object} feedItem The feed item to check
 * @param {Object} prefs The Current settings
 * @return {boolean} The decision whether to show that item or not
 */
GoogleDocs.prototype.shouldShowFeedItem_ = function(feedItem, prefs) {
    var docType = this.extractDocType(feedItem);
    return prefs['docs_'+docType];
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
	    try {
		var child = this.buildFeedItemElement_(feedEntryTemplate,
						       this.feedItems_[i]);
		if (child) {
		    div.appendChild(child);
		    count++;
		}
		// select only documents that the user chose to show and also only if we know who the user is
		// if (this.shouldShowFeedItem_(this.feedItems_[i], this.options_) && this.userEmail_ != null) {
		//     var child = this.buildFeedItemElement_(feedEntryTemplate,
		// 					   this.feedItems_[i]);
		//     if (child) {
		// 	div.appendChild(child);
		// 	count++;
		//     }
		// }
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
// GoogleDocs.prototype.buildFeedDom = function(feedEntryTemplate) {
//   var div = document.createElement('div');
//   var count = 0;
//   if (!!this.feedItems_.length) {
//     for (var i = 0; i < this.feedItems_.length; ++i) {
// 	// if (i == 0) {
// 	//     alert(JSON.stringify(this.feedItems_[i]));
//         // }
//       try {
//         // select only documents that the user chose to show and also only if we know who the user is
//         if (this.shouldShowFeedItem_(this.feedItems_[i], this.options_) && this.userEmail_ != null) {
//           var child = this.buildFeedItemElement_(feedEntryTemplate,
//                                                  this.feedItems_[i]);
//           if (child) {
//             div.appendChild(child);
//             ++count;
//           }
//         }
//       } catch (e) {
//         console.log('Exception ' + e);
//       }
//     }
//   }

//   if (count == 0) {
//     var noItems = document.createElement('h2');
//     noItems.innerHTML = chrome.i18n.getMessage('messageNoFeedItems');
//     div.appendChild(noItems);
//   }

//   return div;
// };


/**
 * Get document type from the feed item, including our own logic processing of the types
 * @param {Object} feedItem The feed item;
 * @return {string} The document type string
 */
GoogleDocs.prototype.extractDocType = function(feedItem) {
  var docType = '';
  for (var i = 0; i < feedItem['category'].length; ++i) {
      if (feedItem['category'][i]['scheme'] == "http://schemas.google.com/g/2005#kind") {
	  docType = feedItem['category'][i]['label'];
	  // Image docType attaches file type like 'image/png', 'image/jpg', remove that
	  if (docType.match(/image/) != null) {
	      docType = 'image';
	  } else if (docType == "application/vnd.ms-powerpoint") { // Powerpoint docType;
	      docType = 'powerpoint';
	  }
	  break;
      }
  }
  if (GoogleDocs.SUPPORTED_DOC_TYPES.indexOf(docType) == -1) {
      docType = 'generic';
  }
  return docType;
};


GoogleDocs.prototype.buildFeedItemElement_ = function(template, feedItem) {
    var file = feedItem.file;
    var itemId = file.id;
    var feedEntryTimestamp = file.modifiedDate;

    var feedEntryTitle = file.title;

    // Build the basic DOM for the feed entry from the template.
    var domFeedEntry = template.cloneNode(true);

    Util.setChildHTML(domFeedEntry, 'feed-entry-title-text', feedEntryTitle);
    Util.setChildHTML(domFeedEntry, 'feed-entry-timestamp',
                      '(' + Util.formatTimeSince(feedEntryTimestamp) + ')');

    var docUrl = file.alternateLink;

    // // Setup icon
    // var actionIcon = Util.getFirstElementByClass(domFeedEntry,
    //                                            'feed-entry-action-icon');
    // var docType = this.extractDocType(feedItem);
    // Util.setCssClass(actionIcon,
    //                'feed-entry-action-icon message-sprite ' + docType);

    var actionIcon = Util.getFirstElementByClass(domFeedEntry, 'feed-entry-action-icon');
    Util.setImg(actionIcon, file.iconLink);

    Util.setAnchorHref(domFeedEntry, 'docs-entry-link', docUrl);
    var modifiedBy = file.lastModifyingUserName || 'unknown';
    Util.setChildHTML(domFeedEntry, 'docs-entry-byuser', 'by ' + modifiedBy);

    Util.setCssClass(domFeedEntry, 'feed-entry');
    return domFeedEntry;
};


GoogleDocs.prototype.setBadgeText_ = function() {
    chrome.identity.getAuthToken({ interactive: false }, function(token) {
	if (token) {
	    var count = this.numNewItems_;
	    var displayedCount = count || '';
	    chrome.browserAction.setBadgeText({'text': '' + displayedCount});
	} else {
	    chrome.browserAction.setBadgeText({'text': ''});
	}
    });
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

Util.setImg = function(element, link) {
  element.src = link;
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


/**
 * Serialize Javascript object to create url query string
 * From: http://stackoverflow.com/questions/1714786/querystring-encoding-of-a-javascript-object
 * @param {Object} obj The input object
 * @return {String} Query string created from obj
 */
Util.serialize = function(obj) {
  var str = [];
  for(var p in obj)
     str.push(p + "=" + encodeURIComponent(obj[p]));
  return str.join("&");
};


GoogleDocs.prototype.openInTab = function(url) {
    chrome.tabs.create({'url': url} );
};


/**
 * Create new popup window for the given URL
 * @param {String} url The url to open in the new window
 */
GoogleDocs.prototype.openInNewWindow = function(url) {
    chrome.windows.create({'url': url,
			   'focused': true,
			   'type': 'normal'
			  });
};


/**
 * Get unique timestamp for logging
 * @param {Object} obj input GoogleDocs object which has a starttime property
 * @return {time} timestamp (seconds)
 */
Util.getTime = function(obj) {
  if (obj === undefined) {
      starttime = 0;
  } else {
      starttime = obj.starttime;
  }
  return (new Date().getTime()/1000 - starttime).toFixed(3);
};
