define(["backbone", "knockout", "text!views/sidePanel/sidePanel.html", "gameAccessor"],
    function(backbone, ko, template, _b) {
    var exports = {};

    exports.SidePanel = backbone.View.extend({
        initialize: function() {
            this.viewModel = this.initViewModel();
        },
        render: function(){
            ko.applyBindings(this.viewModel, this.$el.append(template)[0]);
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