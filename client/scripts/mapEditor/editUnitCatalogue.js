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
        initialize: function(unitCatalogue) {
            var that = this;
            function parseUnitInfo (info, unitType) {
                var previousUnitType = unitType;
                var unitObject =  {
                    unitType: ko.observable(unitType),
                    unitInfo: _.object(_.map(["cost", "attack", "defence", "move", "terrainType", "imageSource"], function (fieldName) {
                        var observable = ko.observable(info[fieldName] || "")
                            .extend({
                                numeric: !_.contains(["terrainType", "imageSource"], fieldName)
                            });
                        observable.subscribe(function (newValue) {
                            info[fieldName] = newValue;
                        });
                        return [fieldName, observable];
                    })),
                    selectImage: function () {
                        var imageSelector = new ImageSelectorView();
                        imageSelector.render();
                        imageSelector.on("selectImage", function (filePath) {
                            unitObject.unitInfo.imageSource(filePath);
                        })
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
                    Close: function () {
                        that.$el.dialog("close");
                    }
                }
            });
        }
    });
});