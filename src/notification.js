        $(document).ready(function() {
           var bkg = chrome.extension.getBackgroundPage();
           var gdocs = bkg.gdocs;
           var url = purl();

           var title = url.param('title');
           var timestamp = url.param('timestamp');
           var doctype = url.param('doctype');
           var modifiedBy = url.param('modifiedBy');
           var docUrl = url.param('docUrl');
           var timeout = parseInt(url.param('timeout')) || 10;

	   $('span.feed-entry-title-text').html(title);
	   $('span.feed-entry-timestamp').html(timestamp);
	   $('span.docs-entry-byuser').html('by '+modifiedBy);
	   $('img.feed-entry-action-icon').addClass('message-sprite '+doctype);

           $("a.docs-entry-link").attr("href", docUrl);
	   $('a.docs-entry-link').click(function() {
	     gdocs.openInNewWindow(docUrl);
	     gdocs.resetNumNewItems();
	     window.close();
             });

           window.setTimeout(function() { 
                         window.close();
                        }, timeout * 1000);
        });
