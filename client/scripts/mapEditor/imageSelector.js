define(["backbone", "knockout", "underscore", "text!/static/templates/imageSelector.ko.html"],
function(backbone, ko, _, template) {

    return backbone.View.extend({
        initialize: function(options) {
            var that = this;

            this.options = options;

            var directory = ko.observableArray([])
            this.viewModel = {
                directory: directory,
                images: ko.observableArray([]),
                directories: ko.observableArray([]),
                inSubdirectory: ko.computed(function () {
                    return directory().length;
                }),
                upLevel: function () {
                    directory.pop();
                    that.fetch();
                }
            };
            this.fetch();
            return this;
        },
        fetch: function () {
            var that = this;
            function imageVM (imageName) {
                var rootPath = "/static/images/";
                var directoryPath = that.viewModel.directory().length ? that.viewModel.directory().join("/") + "/" : "";
                return {
                    fileName: imageName,
                    source: rootPath + directoryPath + imageName,
                    onClick: function () {
                        that.onClick(directoryPath + imageName);
                    }
                }
            }
            function directoryVM (dirName) {
                return {
                    displayName: dirName,
                    onClick: function () {
                        that.viewModel.directory.push(dirName);
                        that.fetch();
                    }
                }
            }
            $.getJSON("/listImages", {
                directory: that.viewModel.directory().join("/")
            }).done(function(directoryContents){
                that.viewModel.images(_.map(directoryContents.images, imageVM));
                that.viewModel.directories(_.map(directoryContents.directories, directoryVM));
            });
        },
        onClick: function () {
            if (_.isFunction(this.options.onClick)) {
                this.options.onClick.apply(this, arguments)
            }
        },
        render: function () {
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