define(["backbone",
        "underscore",
        "knockout",
        "text!views/sidePanel/sidePanel.ko.html",
        "gameAccessor",
        "views/sidePanel/boughtUnits",
        "views/sidePanel/conflicts",
        "views/sidePanel/countries",
        "views/sidePanel/territoryInfo"],
    function(backbone, _, ko, template, _b, BoughtUnitView, ConflictView, CountriesView, TerritoryInfoView) {
    var exports = {};

    exports.SidePanel = backbone.View.extend({
        initialize: function() {
            this.viewModel = this.initViewModel();
        },
        render: function () {
            ko.applyBindings(this.viewModel, $(template).appendTo(this.$el)[0]);
            _.each(this.viewModel.panels, function (data) {
                data.attachContent($("."+data.panelContentsClass, this.$el))
            }, this)
        },

        initViewModel: function() {
            function createRenderCallback (View) {
                return function (element) {
                    (new View({
                        el: element
                    })).render();
                }
            }
            function togglePanel (panelData) {
                panelData.collapsed(!panelData.collapsed());
            }
            var SidePanelVM = {
                togglePanel: togglePanel,
                panels: [
                    {
                        header: "Territory Info",
                        panelContentsClass: "territory-info-container",
                        attachContent: createRenderCallback(TerritoryInfoView),
                        collapsed: ko.observable(false)
                    },
                    {
                        header: "Purchased Units",
                        panelContentsClass: "bought-units-container",
                        attachContent: createRenderCallback(BoughtUnitView),
                        collapsed: ko.observable(false)
                    },
                    {
                        header: "Conflicts",
                        panelContentsClass: "conflicts-container",
                        attachContent: createRenderCallback(ConflictView),
                        collapsed: ko.observable(false)
                    },
                    {
                        header: "Countries",
                        panelContentsClass: "countries-container",
                        attachContent: createRenderCallback(CountriesView),
                        collapsed: ko.observable(false)
                    }
                ]
            };
            SidePanelVM.canEndPhase = function () {
                var board;
                try {
                    board = _b.getBoard();
                } catch(e) {
                    console.error(e);
                    return false;
                }
                return board.isCurrentPlayersTurn();
            };

            SidePanelVM.endPhase = function () {
                _b.getBoard().nextPhase();
            };

            SidePanelVM.toggleTerritoryInfoMode = function () {
                _b.getBoard().toggleTerritoryInfoMode();
            };
            SidePanelVM.infoModeActive = ko.computed(function () {
                return _b.getBoard().inTerritoryInfoMode();
            });
            return SidePanelVM;
        }
    });
    return exports;
});
