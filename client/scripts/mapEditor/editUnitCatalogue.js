define([
    "backbone",
    "knockout",
    "underscore",
    "text!/static/html/knockoutTemplates/editUnitCatalogue.ko.html",
    "dialogs",
    'mapEditor/imageSelector'
],
function(backbone, ko, _, template, _dialogs, ImageSelectorView) {

    return backbone.View.extend({
        initialize: function(unitCatalogue, countries) {
            var that = this;
            var singleImageSelector = null;
            function setImageSelector (newSelector) {
                if (singleImageSelector) {
                    singleImageSelector.remove();
                }
                singleImageSelector = newSelector;
                return singleImageSelector;
            }
            var currentCountry = ko.observable(countries[0].name);
            function parseUnitInfo (info, unitType) {
                var previousUnitType = unitType;
                var images = _.object(_.map(countries, function (country) {
                    var imagePath = ko.observable(info.imageSource[country.name]);
                    imagePath.subscribe(function (newValue) {
                        if (!_.isObject(info.imageSource)) {
                            info.imageSource = {};
                        }
                        info.imageSource[country.name] = newValue;
                    });
                    return [country.name, imagePath]
                }));
                var fields = ["cost", "attack", "defence", "landMove", "seaMove", "move", "terrainType"];
                var unitObject =  {
                    unitType: ko.observable(unitType),
                    unitInfo: _.object(_.map(fields, function (fieldName) {
                        var existingValue = info[fieldName];
                        var observable = ko.observable(existingValue == undefined ? "" : existingValue)
                            .extend({
                                numeric: !_.contains(["terrainType"], fieldName)
                            });
                        observable.subscribe(function (newValue) {
                            info[fieldName] = newValue; // update the unitCatalogue
                        });
                        return [fieldName, observable];
                    })),
                    imageSource: ko.computed(function () {
                        var imageSource = images[currentCountry()]();
                        if (imageSource) {
                            return "/static/images/" + imageSource;
                        } else {
                            return "";
                        }
                    }),
                    selectImage: function (data, event) {
                        if (singleImageSelector && singleImageSelector.for == data) {
                            setImageSelector(null);
                            return;
                        }

                        var imageRow = $("<tr>").insertAfter($(event.currentTarget).closest("tr"));
                        var imageCell = $("<td>")
                            .appendTo(imageRow)
                            .attr("colspan", 7);
                        var imageSelector = setImageSelector(new ImageSelectorView({
                            el: imageCell,
                            onClick: function (filePath) {
                                images[currentCountry()](filePath);
                            },
                            onRemove: function () {
                                imageRow.remove();
                            }
                        }));
                        imageSelector.for = data;
                        imageSelector.render();
                    }
                };
                unitObject.unitType.subscribe(function (newValue) {
                    unitCatalogue[newValue] = unitCatalogue[previousUnitType];
                    delete unitCatalogue[previousUnitType];
                });
                unitObject.unitType.subscribe(function(oldValue) {
                    previousUnitType = oldValue;
                }, null, "beforeChange");
                return unitObject;
            }
            this.viewModel = {
                currentCountry: currentCountry,
                countries: countries,
                unitCatalogue: ko.observableArray(_.map(unitCatalogue, parseUnitInfo)),
                addUnit: function () {
                    var newUnit = {
                        cost: 0,
                        move: 0,
                        attack: 0,
                        defence: 0,
                        terrainType: "land",
                        description: "",
                        imageSource: ""
                    };
                    var name = "unnamed";
                    var counter = 0;
                    var fullName = name;
                    while (fullName in unitCatalogue) {
                        fullName = name + counter;
                        counter++;
                    }
                    unitCatalogue[fullName] = newUnit;
                    that.viewModel.unitCatalogue.push(parseUnitInfo(newUnit, fullName));
                }
            };
            return this;
        },
        render: function() {
            var that = this;
            var initialHeight = Math.min(500, window.innerHeight);
            ko.applyBindings(this.viewModel, this.$el.append(template)[0]);
            this.$el.dialog({
                title: "Units",
                create: _dialogs.replaceCloseButton,
                width: Math.min(700, window.innerWidth), // never larger than screen, or 600px
                height: initialHeight,
                buttons: {
                    Done: function () {
                        that.$el.dialog("close");
                    }
                }
            });
        }
    });
});