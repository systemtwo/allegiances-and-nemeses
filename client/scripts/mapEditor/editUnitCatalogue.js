define(["backbone", "knockout", "underscore", "text!/static/templates/editUnitCatalogue.ko.html", "dialogs"],
function(backbone, ko, _, template, _dialogs) {

    // Taken from knockout website
    ko.extenders.numeric = function(target) {
        //create a writable computed observable to intercept writes to our observable
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
    };

    return backbone.View.extend({
        initialize: function(unitCatalogue) {
            var that = this;
            function parseUnitInfo (info, unitType) {
                var previousUnitType = unitType;
                var unitObject =  {
                    unitType: ko.observable(unitType),
                    unitInfo: _.object(_.map(info, function (fieldValue, fieldName) {
                        var observable = ko.observable(fieldValue).extend({numeric: true});
                        observable.subscribe(function (newValue) {
                            info[fieldName] = newValue;
                        });
                        return [fieldName, observable];
                    }))
                };
                unitObject.unitType.subscribe(function (newValue) {
                    console.log(arguments);
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
                        description: ""
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
                height: initialHeight
            });
        }
    });
});