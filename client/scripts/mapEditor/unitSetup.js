define(["backbone", "underscore", "knockout", "text!views/moveUnit/moveUnit.ko.html", "helpers", "jquery-ui"],
    function(backbone, _, ko, template, _h) {
    var UnitSetupView = backbone.View.extend({
        initialize: function(territory, territoryUnitTypes, unitCatalogue) {
            this.territory = territory;
            this.unitCatalogue = unitCatalogue;
            this.territoryUnitTypes = ko.observableArray(territoryUnitTypes);

            this.viewModel = this.initViewModel();
            return this;
        },
        initViewModel: function(){
            var view = this;
            return {
                originUnits: _.map(this.unitCatalogue, function (unitInfo, unitType) {
                    return {
                        canMove: true,
                        onClick: function () {
                            console.log(unitType);
                            view.territoryUnitTypes.push(unitType)
                        },
                        imageTitle: unitType,
                        imageSource: _h.getImageSource(unitInfo, view.territory.country)
                    }
                }),
                destinationUnits: ko.computed(function () {
                    return _.map(view.territoryUnitTypes(), function (unitType) {
                        return {
                            canMove: true,
                            onClick: function () {
                                console.log(unitType);
                                var index = view.territoryUnitTypes.indexOf(unitType);
                                view.territoryUnitTypes.splice(index, 1);
                            },
                            imageTitle: unitType,
                            imageSource: _h.getImageSource(view.unitCatalogue[unitType], view.territory.country)
                        }
                    });
                })
            }
        },

        render: function() {
            // For now, and probably for a while, we'll show this as a dialog
            this.$el.dialog({
                title: "Setup units in " + this.territory.name,
                width: 600,
                buttons: {
                    "Done": function () {
                        $(this).dialog("close");
                    }
                }
            });
            ko.applyBindings(this.viewModel, this.$el.append(template)[0]);
        }
    });
    return UnitSetupView;
});
