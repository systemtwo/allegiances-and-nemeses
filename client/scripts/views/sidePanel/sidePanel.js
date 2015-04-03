define(["backbone", "knockout", "text!views/sidePanel/sidePanel.html", "gameAccessor", "views/sidePanel/boughtUnits", "views/sidePanel/conflicts"],
    function(backbone, ko, template, _b, BoughtUnitView, ConflictView) {
    var exports = {};

    exports.SidePanel = backbone.View.extend({
        initialize: function() {
            this.viewModel = this.initViewModel();
        },
        render: function(){
            ko.applyBindings(this.viewModel, this.$el.append(template)[0]);

            this.boughtUnitView = new BoughtUnitView({
                el: $(".bought-units-container", this.$el)
            });
            this.boughtUnitView.render();

            this.conflictView = new ConflictView({
                el: $(".conflicts-container", this.$el)
            });
            this.conflictView.render();
        },

        initViewModel: function() {
            var SidePanelVM = {};
            SidePanelVM.canEndPhase = function () {
                return true;
            };

            SidePanelVM.endPhase = function () {
                _b.getBoard().nextPhase();
            };
            return SidePanelVM;
        }
    });
    return exports;
});