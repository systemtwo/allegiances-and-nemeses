define(["backbone", "knockout", "text!views/moveUnit/moveUnit.html", "helpers"],
    function(backbone, ko, template, _h) {
    var UnitSetupView = backbone.View.extend({
        initialize: function(territory, unitCatalogue) {
            this.territory = territory;
            this.unitCatalogue = unitCatalogue;

            this.viewModel = this.initViewModel();
            return this;
        },
        initViewModel: function(){
            var view = this;
            return {
                originUnits: this.unitCatalogue.map(function (unit) {
                    return {
                        canMove: true,
                        onClick: function () {
                            console.log(unit);
                        },
                        imageSource: _h.getImageSource(unit.unitType, view.territory.country)
                    }
                }),
                destinationUnits: []
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