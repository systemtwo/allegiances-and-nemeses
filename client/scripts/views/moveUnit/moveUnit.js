define(["backbone", "knockout", "text!views/moveUnit/moveUnit.html", "helpers", "gameAccessor", "router"],
    function(backbone, ko, template, _h, _b, _router) {
    var MoveUnitView = backbone.View.extend({
        /**
         *
         * @param fromTerritory
         * @param destinationTerritory
         */
        initialize: function(fromTerritory, destinationTerritory) {
            this.fromTerritory = fromTerritory;
            this.destinationTerritory = destinationTerritory;

            this.viewModel = this.initViewModel();
            return this;
        },
        initViewModel: function(){
            var view = this;
            var MoveUnitVM = function() {
                var viewModel = this;
                function sort(unitA, unitB) {
                    var canMoveA = viewModel.canMove(unitA);
                    var canMoveB = viewModel.canMove(unitB);
                    if (canMoveA == canMoveB) {
                        return 0;
                    } else {
                        return canMoveA ? -1 : 1;
                    }
                }
                function canMove(unit) {
                    var currentPhase = _b.getBoard().currentPhase;
                    if (unit.territory == view.fromTerritory)
                        return currentPhase.canMove(unit, view.destinationTerritory);
                    else
                        return currentPhase.canMove(unit, view.fromTerritory);
                }
                function parseUnit(unit) {
                    return {
                        imageSource: _h.getImageSource(unit.unitType, unit.country),
                        canMove: canMove(unit),
                        onClick: function(unitData) {
                            var origin,destination, undo;
                            if (canMove(unit)) {
                                if (unit.territory == view.fromTerritory) {
                                    viewModel.moveUnitToDestination(unitData);
                                    undo = viewModel.moveUnitToOrigin.bind(viewModel);
                                    origin = view.fromTerritory;
                                    unit.territory = destination = view.destinationTerritory;
                                } else {
                                    viewModel.moveUnitToOrigin(unitData);
                                    undo = viewModel.moveUnitToDestination.bind(viewModel);
                                    origin = view.destinationTerritory;
                                    unit.territory = destination = view.fromTerritory;
                                }
                                _router.validateMove(origin, destination, unit.id).fail(function onFail() {
                                    unit.territory = origin;
                                    undo(unitData);
                                    alert("Invalid move");
                                }).done(function() {
                                    _b.getBoard().updateConflicts();
                                });
                            }
                        }
                    }
                }
                this.originUnits = ko.observableArray(view.fromTerritory.units().map(parseUnit));
                this.destinationUnits = ko.observableArray(view.destinationTerritory.units().map(parseUnit));

                this.moveUnitToDestination = function(unit) {
                    viewModel.originUnits.remove(unit);
                    viewModel.destinationUnits.push(unit);
                    viewModel.destinationUnits.sort(sort);
                };
                this.moveUnitToOrigin = function(unit) {
                    viewModel.destinationUnits.remove(unit);
                    viewModel.originUnits.push(unit);
                    viewModel.originUnits.sort(sort);
                };
                viewModel.originUnits.sort(sort);
                viewModel.destinationUnits.sort(sort);
            };

            return new MoveUnitVM();
        },

        render: function() {
            // For now, and probably for a while, we'll show this as a dialog
            this.$el.dialog({
                title: "Move Units from " + this.fromTerritory.name + " to " + this.destinationTerritory.name,
                width: 600,
                buttons: {
                    "Done": function () {
                        _b.getBoard().currentPhase.reset();
                        $(this).dialog("close");
                    }
                }
            });
            ko.applyBindings(this.viewModel, this.$el.append(template)[0]);
        }
    })
    return MoveUnitView;
});