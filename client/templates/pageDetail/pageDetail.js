/**
 * productImageGallery helpers
 */

let Media = ReactionCore.Collections.Media;

/**
 * uploadHandler method
 */

function uploadHandler(event) {
  let pageId = selectedPageId();
  let shopId = selectedPage().shopId || ReactionCore.getShopId();
  let userId = Meteor.userId();
  //let alt = values.alt;
  let count = Media.find({
    "metadata.pageId": pageId
  }).count();

  FS.Utility.eachFile(event, function (file) {
    let fileObj;
    fileObj = new FS.File(file);
    fileObj.metadata = {
      ownerId: userId,
      pageId: pageId,
      shopId: shopId
    };

    // progress bar
    let prefix = "trumbowyg-";
    if ($('.' + prefix + 'progress').length === 0) {
      $('.' + prefix + 'modal-title').after(
        $('<div/>').attr('class', prefix + 'progress').append(
          $('<div/>').attr('class', prefix + 'progress-bar').css('width', 0)
        )
      );
    } else {
      $('.' + prefix + 'progress-bar').css('width', 0);
    }

    Media.insert(fileObj, function (err, fileObj) {

      // progress bar
      var myInterval = setInterval(function () {
        let progress = fileObj.uploadProgress();
        $('.' + prefix + 'progress-bar').stop().animate({
          width: progress + '%'
        });
        console.log(progress);
        if(progress === 100) {
          clearInterval(myInterval);
        }
      }, 1);

      Session.set('file-uploaded', fileObj);
    });
    return count++;
  });
}

/**
 * pageDetail helpers
 */

Template.pageDetail.helpers({
  fieldComponent: function () {
    if (ReactionCore.hasPermission("createPage")) {
      return Template.pageDetailEdit;
    }
    return Template.pageDetailField;
  }
});

/**
 * pageDetail events
 */

Template.pageDetail.events({
  "click .toggle-page-isVisible-link": function (event, template) {
    let errorMsg = "";
    const self = this;
    if (!self.title) {
      errorMsg += "Page title is required. ";
      template.$(".title-edit-input").focus();
    }
    if (!self.content) {
      errorMsg += "Page content is required. ";
      template.$(".content-edit-input").focus();
    }
    if (errorMsg.length > 0) {
      Alerts.add(errorMsg, "danger", {
        placement: "pageManagement",
        i18nKey: "pageDetail.errorMsg"
      });
    } else {
      Meteor.call("pages/publishPage", self._id, function (error) {
        if (error) {
          return Alerts.add(error.reason, "danger", {
            placement: "pageManagement",
            id: self._id,
            i18nKey: "pageDetail.errorMsg"
          });
        }
      });
    }
  },
  "click .delete-page-link": function () {
    maybeDeletePage(this);
  },
  "change input:file": uploadHandler
});

Template.pageDetail.onRendered(function () {
  this.autorun((function (_this) {
    return function () {
      Session.delete('editing-content-savetime');
      $('.content-edit-input').trumbowyg({
        btnsDef: {
          image: {
            title: 'Insert image',
            dropdown: ['insertImage', 'upload'],
            ico: 'insertImage'
          }
        },
        btns: ['viewHTML',
          '|', 'formatting',
          '|', 'btnGrp-semantic',
          '|', 'link',
          '|', 'image',
          '|', 'btnGrp-justify',
          '|', 'btnGrp-lists',
          '|', 'horizontalRule',
          '|', 'removeformat'
        ],
        removeformatPasted: true,
        autogrow: true,
        fullscreenable: false,
        lang: Session.get("language"),
        uploadHandler: function(tbw, alt) {
          let fileObj = Session.get('file-uploaded');
          var url = fileObj.url();
          tbw.execCmd('insertImage', url);
          $('img[src="' + url + '"]:not([alt])', tbw.$box).attr('alt', alt);
          setTimeout(function () {
            tbw.closeModal();
          }, 250);
        },
      });
      // TODO: move to CSS
      // changing default width
      $('.trumbowyg-box').css('width', '100%');
    };
  })(this));
});
