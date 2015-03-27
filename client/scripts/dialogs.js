define(["nunjucks", "gameAccessor", "router", "helpers"], function(nj, _b, _router, _helpers) {
    /**
     * Shows the list of all available boards (replaced during lobby feature)
     * @param boards list of all boards
     * @param onSelect function to call when a board is selected
     */
    function showBoardList(boards, onSelect) {
        var windowContents = $(nj.render("static/templates/boardList.html", {boards: boards}));
        windowContents.dialog({
            title: "Boards",
            buttons: {
                "New Board": function() {
                    _router.newBoard().done(function(response) {
                        response = JSON.parse(response);
                        // Add it to the list
                        // Important update this when updating boardList.html
                        windowContents.find("#boardSelect").append($('<option>').val(response.boardId).text(response.name))
                    });
                },
                "Load": function() {
                    var boardId = windowContents.find("#boardSelect").val();
                    onSelect(boardId, function closeBoardList() {
                            windowContents.dialog("close");
                        }
                    );
                }
            }
        })
    }

    // TODO dschwarz clean this function, break it down into more manageable pieces
    /**
     * Shows the list of units that can be moved, and which territories they come from.
     */
    var moveWindow = null;
    function showMoveWindow(enabledUnits, disabledUnits, from, destination) {
        if (moveWindow) {
            moveWindow.dialog("destroy");
        }
        disabledUnits = disabledUnits || []; // optional parameter

        // Sort into buckets territory->unitType->{amount, imageSource, reason}
        var unableUnitDict = {};
        var ableUnitDict = {};
        function eachUnit(u, dict, reason) { // key is enabled or disabled
            var tName = u.beginningOfPhaseTerritory.name; // maybe this should be beginning of turn territory
//            if (tName !== u.beginningOfTurnTerritory.name) {
//                tName = u.beginningOfTurnTerritory.name + "->" + tName; // Units that have moved in a previous phase have reduced move
//            }
            if (!(tName in dict))
                dict[tName] = {};

            var unitData = dict[tName][u.unitType];
            if (unitData) {
                unitData.amount += 1;
            } else {
                dict[tName][u.unitType] = {
                    amount: 1,
                    imageSource: _helpers.getImageSource(u.unitType, u.country),
                    reason: reason // only defined for disabled units
                };
            }
        }
        enabledUnits.forEach(function(unit) {
            eachUnit(unit, ableUnitDict);
        });
        disabledUnits.forEach(function(unitObject) {
            eachUnit(unitObject.unit, unableUnitDict, unitObject.reason);
        });
        moveWindow = $(nj.render("static/templates/moveUnits.html", {
            able: ableUnitDict,
            unable: unableUnitDict,
            ableLength: Object.keys(ableUnitDict).length,
            unableLength: Object.keys(unableUnitDict).length
        }));
        // attach listeners to enabled units
        moveWindow.find(".unitBlock.able").mousedown(function onUnitClick(e) {
            e.preventDefault();
            var row = $(e.currentTarget);
            var amountElement = row.find(".selectedAmount");
            console.assert(!isNaN(parseInt(amountElement.text())), "Amount selected is NaN");
            var newVal = (parseInt(amountElement.text()) || 0) + 1; // increment by one
            if (newVal > parseInt(row.data("max"))) {
                newVal = 0; // cycle back to 0
            }
            amountElement.text(newVal);
        });

        moveWindow.dialog({
            title: "Move Units from " + from.name + " to " + destination.name,
            modal: false,
            width: 600,
            buttons: {
                "Move All": function() {
                    var unitList = [];
                    for (var tName in ableUnitDict) {
                        if (ableUnitDict.hasOwnProperty(tName)) {
                            var units = ableUnitDict[tName];
                            for (var unitType in units) {
                                if (units.hasOwnProperty(unitType)) {
                                    unitList.push({
                                        unitType: unitType,
                                        originalTerritoryName: tName,
                                        amount: units[unitType].amount
                                    })
                                }
                            }
                        }
                    }
                    _b.getBoard().currentPhase.moveUnits(unitList);
                    $(this).dialog("close");
                },
                "Move": function () {
                    var selectedUnits = [];
                    moveWindow.find(".unitBlock.able").each(function() {
                        var row = $(this);
                        selectedUnits.push({
                            unitType: row.data("type"),
                            originalTerritoryName: row.data("territory").toString(),
                            amount: parseInt(row.find(".selectedAmount").text())
                        })
                    });
                    _b.getBoard().currentPhase.moveUnits(selectedUnits);
                    $(this).dialog("close");
                },
                "Cancel": function () {
                    $(this).dialog("close");
                }
            }
        })
    }

    var conflictWindow = null;
    function showConflictList() {
        closeConflicts();
        var conflictList = $(nj.render("static/templates/conflictList.html", {
            conflicts: _b.getBoard().boardData.conflicts
        }));

        conflictList.find(".conflict-actions").each(function(index, actionSection) {
            actionSection = $(actionSection);
            var tName = actionSection.closest("[data-name]").data("name");
            actionSection.find(".resolve-conflict").each(function(index, button) {
                $(button).click(function onResolveClick() {
                    _b.getBoard().currentPhase.showBattle(tName);
                });
            });
            actionSection.find(".autoresolve-conflict").each(function(index, button) {
                $(button).click(function onResolveClick() {
                    _b.getBoard().currentPhase.autoResolve(tName);
                });
            });
        });

        $("button.details", conflictList).click(function(event){
            var name = $(event.currentTarget).closest("[data-name]").data("name");
            showBattle(name);
        });

        $("#autoresolve-all", conflictList).click(function() {
            _b.getBoard().currentPhase.autoResolveAll();
        });

        conflictWindow = conflictList.dialog({
            title: "Conflicts",
            width: 640,
            height: 400
        });
    }

    /**
     * Closes the conflict list dialog
     */
    function closeConflicts() {
        if (conflictWindow) {
            conflictWindow.dialog("destroy");
            conflictWindow = null;
        }
    }

    function showBattle(tName) {
        // get the conflict
        var conflict = _b.getBoard().getConflictByTerritoryName(tName);

        // render a dialog for it
        var dialog = $(nj.render("static/templates/battleground.html", {
            conflict: conflict,
            images: _b.getBoard().info.imageMap
        }));

        $(".report", dialog).click(function() {
            $(this).toggleClass("collapsed");
        });
        dialog.dialog({
            title: "Battle for " + conflict.territoryName,
            width: 600,
            height: 400
        });
    }

    /**
     * Shows the list of units bought, indicates which are available to be placed, and which have already been placed
     */
    function showPlacementWindow(units) {
        var window = $(nj.render("static/templates/place.html", {
            units: units,
            images: _b.getBoard().info.imageMap
        }));


        window.dialog({
            title: "Units to Place",
            modal: false
        });
    }

    return {
        showBoardList: showBoardList,
        showConflictList: showConflictList,
        closeConflicts: closeConflicts,
        showBattle: showBattle,
        showPlacementWindow: showPlacementWindow
    }
});