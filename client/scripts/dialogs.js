define([
        "knockout",
        "underscore",
        "gameAccessor",
        "text!../templates/battleground.ko.html",
        "text!../templates/units.ko.html",
        "text!../templates/saveGameForm.ko.html",
        "helpers"
    ],
    function(ko, _, _b, battlefieldTemplate, unitsTemplate, saveGameTemplate, _helpers) {

    function replaceCloseButton(event, ui) {
        var element = $(this);
        var widget = element.dialog("widget");
        $(".ui-dialog-titlebar-close", widget).remove();
        $(".ui-dialog-titlebar", widget).append(
            $("<span>")
                .addClass("glyphicon glyphicon-remove close-icon")
                .click(function () {
                    element.dialog("close");
                })
        )
    }

    // map of conflict id to dialog view model
    var openConflictDialogs = {};
    function showBattle(conflictId) {
        // get the conflict
        var board = _b.getBoard();
        if (openConflictDialogs[conflictId]) {
            console.log("Conflict already open");
            openConflictDialogs[conflictId].dialog("open");
            return;
        }

        var conflict = board.getConflict(conflictId);

        // render a dialog for it
        var dialog = $("<div>").appendTo(document.body).append(battlefieldTemplate);
        var viewModel = {
            conflict: ko.observable(conflict),
            getImageSource: function (unitType, country) {
                return _helpers.getImageSource(board.unitInfo(unitType), country); // MEMO: this retains a copy of the board, may cause issues
            },
            toggleCollapse: function (data, event) {
                $(event.currentTarget).toggleClass('collapsed')
            }
        };
        ko.applyBindings(viewModel, dialog[0]);

        var subscription = function() {
            var conflict = board.getConflict(conflictId);
            if (conflict) {
                viewModel.conflict(conflict);
            } else {
                console.warn("Conflict no longer exists")
            }
        };
        board.on("change", subscription);
        openConflictDialogs[conflictId] = dialog;

        dialog.dialog({
            title: "Battle for " + board.getTerritoryDisplayName(conflict.territoryName),
            create: replaceCloseButton,
            close: function () {
                delete openConflictDialogs[conflictId];
                board.off("change", subscription);
                subscription = null;
            },
            width: 600,
            height: 400
        });
    }

    /**
     *
     * @param territory
     * @param map The svg map element
     * @param locationInfo
     * locationInfo.pageX {int} x position to position against
     * locationInfo.pageY {int} y position
     */
    function showTerritoryUnits (territory, map, locationInfo) {
        var dialog = $("<div>").appendTo(document.body).append(unitsTemplate);
        ko.applyBindings({
            units: _.map(territory.units(), function (unit) {
                return {
                    unitType: unit.unitType,
                    imageSrc: _helpers.getImageSource(unit.unitInfo, unit.country.name)
                }
            })
        }, dialog[0]);

        dialog.dialog({
            title: "Units in " + territory.displayName,
            create: replaceCloseButton,
            width: 300,
            height: 200,
            position: {
                my: "left+20 center",
                of: locationInfo,
                within: map || window
            }
        });
    }

    var saveGameDialog = null;
    function createSaveGameDialog() {
        if (saveGameDialog) {
            saveGameDialog.dialog("open");
        } else {
            var dialog = $("<div>").appendTo(document.body).append(saveGameTemplate);
            saveGameDialog = dialog;

            ko.applyBindings({
                gameId: _b.getBoard().id
            }, dialog[0]);
            
            dialog.find(".saveGameBtn").click(function () {
                dialog.dialog("destroy");
            });
            dialog.dialog({
                title: "Save Game",
                create: replaceCloseButton,
                close: function () {
                    saveGameDialog = null;
                }
            });
        }
    }

    return {
        showBattle: showBattle,
        showTerritoryUnits: showTerritoryUnits,
        createSaveGameDialog: createSaveGameDialog,
        replaceCloseButton: replaceCloseButton
    }
});