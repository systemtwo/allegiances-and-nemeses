define(["backbone", "underscore", "knockout", "text!views/sidePanel/boughtUnits.html", "helpers", "gameAccessor"],
    function(backbone, _, ko, template, _h, _b) {
    // List of units bought this turn
    var BoughtUnitsView = backbone.View.extend({
        initialize: function() {
            this.viewModel = this.initViewModel();
            return this;
        },
        initViewModel: function(){
            var view = this;
            var vm = {};
            vm.boughtUnits = ko.observableArray(_b.getBoard().boardData.buyList);
            vm.clickUnit = function (boughtUnit) {
                var currentPhase = _b.getBoard().currentPhase;
                if (currentPhase && _.isFunction(currentPhase.selectBoughtUnit)) {
                    currentPhase.selectBoughtUnit(boughtUnit);
                } else {
                    // could show unit info here, or simply do nothing
                }
            };
            vm.getDisplayName = function (territoryName) {
                var territory = _b.getBoard().getTerritory(territoryName);
                return territory && territory.displayName ? territory.displayName : territoryName;
            };
            vm.getImageSrc = function(unitType) {
                var board = _b.getBoard();
                return _h.getImageSource(board.unitInfo(unitType), board.currentCountry);
            };
            vm.canPlace = function(unitType) {
                // change later to return false if it is impossible to place a unit
                // (no access to the sea, bought too many, etc)
                return true;
            };

            vm.inPlacePhase = ko.observable(_b.getBoard().currentPhaseName() === "PlacementPhase");
            vm.setModePlaceMany = function () {
                var currentPhase = _b.getBoard().currentPhase;
                if (currentPhase && _.isFunction(currentPhase.beginPlacingMany)) {
                    currentPhase.beginPlacingMany();
                }
            };

            _b.getBoard().on("change", function() {
                // force an update
                vm.boughtUnits([]);
                vm.boughtUnits(_b.getBoard().buyList());
                vm.inPlacePhase(_b.getBoard().currentPhaseName() === "PlacementPhase");
            });

            return vm;
        },

        render: function() {
            this.$el.empty();
            ko.applyBindings(this.viewModel, $(template).appendTo(this.$el)[0]);
        }
    });
    return BoughtUnitsView;
});