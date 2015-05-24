define(["backbone", "knockout", "underscore", "text!/static/templates/imageSelector.ko.html", "dialogs"],
function(backbone, ko, _, template, _dialogs) {

    var ImageSelectorView = backbone.View.extend({
        initialize: function() {
            var that = this;
            this.viewModel = {
                images: ko.observableArray([])
            };
            this.directory = "";
            function imageVM (imageName) {
                var fullPath = "/static/images/";
                if (that.directory) {
                    fullPath += that.directory + "/";
                }
                return {
                    fileName: imageName,
                    source: fullPath + imageName,
                    onClick: function () {
                        that.trigger("selectImage", fullPath + imageName);
                        that.remove();
                    }
                }
            }
            $.getJSON("/listImages").done(function(imageNames){
                that.viewModel.images(_.map(imageNames, imageVM));
            });
            return this;
        },
        render: function() {
            var that = this;
            var initialHeight = Math.min(500, window.innerHeight);
            ko.applyBindings(this.viewModel, this.$el.append(template)[0]);
            this.$el.dialog({
                title: "Choose an image",
                create: _dialogs.replaceCloseButton,
                width: Math.min(700, window.innerWidth), // never larger than screen, or 600px
                height: initialHeight,
                buttons: {
                    Cancel: function () {
                        that.remove();
                    }
                }
            });
        },
        remove: function () {
            this.$el.dialog("close");
            this.off();
            backbone.View.prototype.remove.call(this);
        }
    });
    $.extend(ImageSelectorView.prototype, backbone.Event)
    return ImageSelectorView;
});