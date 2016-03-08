define(["backbone", "underscore", "knockout", "text!views/sidePanel/territoryInfo.ko.html", "gameAccessor"],
    function(backbone, _, ko, template, _b) {
        var TerritoryPaneView = backbone.View.extend({
            initialize: function(){
                var view = this;

                var ViewModel = function() {
                    var vm = this;
                    var board = _b.getBoard();
                    vm.selectedTerritory = board.selectedTerritory;  // knockout observable

                    return vm;
                };

                this.viewModel = new ViewModel();
                return this;
            },

            render: function() {
                this.$el.empty();
                ko.applyBindings(this.viewModel, $(template).appendTo(this.$el)[0]);
            }
        });
        _.extend(TerritoryPaneView.prototype, backbone.Events);
        return TerritoryPaneView;
    });
