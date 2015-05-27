define(["backbone", "knockout", "underscore", "text!/static/templates/editUnitCatalogue.ko.html", "dialogs", 'mapEditor/imageSelector'],
function(backbone, ko, _, template, _dialogs, ImageSelectorView) {

    // Taken from knockout website
    ko.extenders.numeric = function(target, enableExtension) {
        //create a writable computed observable to intercept writes to our observable
        if (enableExtension) {
            return ko.pureComputed({
                read: target,  //always return the original observables value
                write: function(newValue) {
                    var current = target(),
                        newValueAsNum = parseFloat(+newValue);

                    //only write if it changed
                    if (!isNaN(newValueAsNum) && newValueAsNum !== current) {
                        target(newValueAsNum);
                    } else if (newValue !== current) {
                        target.notifySubscribers(current);
                    }
                }
            }).extend({ notify: 'always' });
        } else {
            return target;
        }
    };

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
                var unitObject =  {
                    unitType: ko.observable(unitType),
                    unitInfo: _.object(_.map(["cost", "attack", "defence", "move", "terrainType"], function (fieldName) {
                        var observable = ko.observable(info[fieldName] || "")
                            .extend({
                                numeric: !_.contains(["terrainType"], fieldName)
                            });
                        observable.subscribe(function (newValue) {
                            info[fieldName] = newValue;
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