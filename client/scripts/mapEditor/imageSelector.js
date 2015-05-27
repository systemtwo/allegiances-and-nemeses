define(["backbone", "knockout", "underscore", "text!/static/templates/imageSelector.ko.html"],
function(backbone, ko, _, template) {

    return backbone.View.extend({
        initialize: function(options) {
            var that = this;

            this.options = options;
            this.onClick = _.isFunction(options.onClick) ? options.onClick : function () {};

            this.viewModel = {
                images: ko.observableArray([])
            };
            this.directory = "";
            function imageVM (imageName) {
                var rootPath = "/static/images/";
                var directoryPath = that.directory ? that.directory + "/" : "";
                return {
                    fileName: imageName,
                    source: rootPath + directoryPath + imageName,
                    onClick: function () {
                        that.onClick(directoryPath + imageName);
                    }
                }
            }
            $.getJSON("/listImages").done(function(imageNames){
                that.viewModel.images(_.map(imageNames, imageVM));
            });
            return this;
        },
        render: function() {
            ko.applyBindings(this.viewModel, $(template).appendTo(this.$el)[0]);
        },
        remove: function () {
            backbone.View.prototype.remove.call(this);
            if (this.options.onRemove) {
                this.options.onRemove();
            }
        }
    });
});