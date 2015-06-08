define(["backbone", "underscore", "knockout", "text!views/sidePanel/conflictList.ko.html", "gameAccessor", "router", "dialogs"],
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
                        territoryDisplayName: board.getTerritory(conflict.territoryName).displayName,
                        resolve: function (conflict) {
                            _router.autoResolve(conflict.territoryName).done(function(){
                                board.updateConflicts();
                            })
                        },
                        openBattle: function (conflict) {
                            _dialogs.showBattle(conflict.territoryName)
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
                    _router.autoResolveAll().done(function(){
                        board.updateConflicts();
                    })
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