      function initialize() {
        var gdocs = chrome.extension.getBackgroundPage().gdocs;
        var options = gdocs.getOptions();

        var pageTitle = document.getElementById('options_page_title');
        pageTitle.innerHTML = chrome.i18n.getMessage('optionPageTitle');

        var titleDesktopNotification = document.getElementById('title_desktop_notification');
        titleDesktopNotification.innerHTML = chrome.i18n.getMessage('titleDesktopNotification');
        var showNotifDiv = document.getElementById('option_show_notification');
        var showNotifLabel = Util.getFirstElementByClass(showNotifDiv, 'optionLabel');
        showNotifLabel.innerHTML = chrome.i18n.getMessage('label_show_desktop_notification');
        if (options['show_desktop_notification']) {
          var checkboxShowNotif = Util.getFirstElementByClass(showNotifDiv, 'optionCheckbox');
          checkboxShowNotif.checked = true;
        }

        var titleWhichDocumentTypes = document.getElementById('title_which_document_types');
        titleWhichDocumentTypes.innerHTML = chrome.i18n.getMessage('titleWhichDocumentTypes');
        var docTypes = ['generic', 'document', 'presentation', 'spreadsheet', 'drawing', 'collection', 'form', 'image', 'pdf', 'powerpoint', 'word', 'fusion'];
        for (var i = 0; i < docTypes.length; ++i) {
          var docType = docTypes[i];
          var optionDiv = document.getElementById('option_docs_' + docType);
          var label = Util.getFirstElementByClass(optionDiv, 'optionLabel');
          label.innerHTML = chrome.i18n.getMessage('label_docs_' + docType);
          if (options['docs_'+docType]) {
            var checkboxEventType = Util.getFirstElementByClass(optionDiv, 'optionCheckbox');
            checkboxEventType.checked = true;
          }
        }

        var saveButton = document.getElementById('save_options');
        saveButton.innerHTML = chrome.i18n.getMessage('buttonSave');
        saveButton.addEventListener('mousedown', function() {
          var newOptions = {
          };

          var showNotifDiv = document.getElementById('option_show_notification');
          var checkboxShowNotif = Util.getFirstElementByClass(showNotifDiv, 'optionCheckbox');
          if (checkboxShowNotif.checked) {
            newOptions['show_desktop_notification'] = true;
          } else {
            newOptions['show_desktop_notification'] = false;
          }

          for (var i = 0; i < docTypes.length; ++i) {
            var docType = docTypes[i];
            var optionDiv = document.getElementById('option_docs_' + docType);
            var checkboxDocType = Util.getFirstElementByClass(optionDiv, 'optionCheckbox');
            if (checkboxDocType.checked) {
              newOptions['docs_'+docType] = true;
            } else {
              newOptions['docs_'+docType] = false;
            }
          }
          gdocs.saveOptions(newOptions);

          setMessage('successMessage', chrome.i18n.getMessage('messageSavedOptions'));

          gdocs.startPolling();
          gdocs.setVisualState();
        });
      }

      function setMessage(messageTypeClass, messageText) {
        var messageDiv = document.getElementById('message');
        var saveButton = document.getElementById('save_options');

        saveButton.disabled = true;
        messageDiv.className = messageTypeClass;
        window.setTimeout(function() {
          messageDiv.innerHTML = messageText;
          messageDiv.style.display = 'block';
        }, 1000);
        window.setTimeout(function() {
          messageDiv.innerHTML = '';
          messageDiv.style.display = 'none';
          saveButton.disabled = '';
          
        }, 5000);
      }

addLoadEvent(initialize);