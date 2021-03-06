define(["backbone", "underscore", "knockout", "text!views/sidePanel/conflicts.ko.html", "gameAccessor", "router", "dialogs"],
    function(backbone, _, ko, template, _b, _router, _dialogs) {
    // List of units bought this turn
    var ConflictView = backbone.View.extend({
        initialize: function() {
            this.viewModel = this.initViewModel();
            return this;
        },
        initViewModel: function(){
            var view = this;

            /**
             * Helper function to return conflict view models
             * @returns {object[]}
             */
            function getConflicts() {
                var board = _b.getBoard();
                return _.map(board.boardData.conflicts, function(c) {
                    /**
                     * @type {Conflict}
                     */
                    var conflict = c;
                    return {
                        templateName: "conflict-outcome-"+conflict.outcome,
                        territoryName: conflict.territoryName,
                        territoryDisplayName: board.getTerritoryDisplayName(conflict.territoryName),
                        attackingCountry: board.getCountryDisplayName(conflict.attackingCountry),
                        defendingCountry: board.getCountryDisplayName(conflict.defendingCountry),
                        resolve: function () {
                            _router.autoResolve(conflict.id).done(function(){
                                board.updateConflicts();
                            })
                        },
                        openBattle: function () {
                            _dialogs.showBattle(conflict.id)
                        }
                    }
                });
            }

            var ViewModel = function() {
                var vm = this;
                var board = _b.getBoard();
                vm.conflicts = ko.observableArray(getConflicts());

                vm.actionsEnabled = ko.observable(view.actionsEnabled());

                this.resolveAll = function () {
                    _router.autoResolveAll();
                };

                board.on("change", function () {
                    vm.conflicts([]);
                    vm.conflicts(getConflicts());
                    vm.actionsEnabled(view.actionsEnabled());
                });

                return vm;
            };

            return new ViewModel();
        },

        actionsEnabled: function () {
            var board = _b.getBoard();
            return board.isCurrentPlayersTurn() && board.currentPhaseName() == "ResolvePhase";
        },

        render: function() {
            this.$el.empty();
            ko.applyBindings(this.viewModel, $(template).appendTo(this.$el)[0]);
        }
    });
    return ConflictView;
});
