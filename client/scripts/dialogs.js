define([
        "knockout",
        "underscore",
        "gameAccessor",
        "text!../templates/battleground.ko.html",
        "text!../templates/units.ko.html",
        "helpers"
    ],
    function(ko, _, _b, battlefieldTemplate, unitsTemplate, _helpers) {

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

    function showBattle(tName) {
        // get the conflict
        var board = _b.getBoard();
        var conflict = board.getConflictByTerritoryName(tName);

        // render a dialog for it
        var dialog = $("<div>").appendTo(document.body).append(battlefieldTemplate);
        ko.applyBindings({
            conflict: conflict,
            getImageSource: function (unitType, country) {
                return _helpers.getImageSource(board.unitInfo(unitType), country); // MEMO: this retains a copy of the board, may cause issues
            },
            toggleCollapse: function (data, event) {
                $(event.currentTarget).toggleClass('collapsed')
            }
        }, dialog[0]);

        dialog.dialog({
            title: "Battle for " + board.getTerritory(tName).displayName,
            create: replaceCloseButton,
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

    return {
        showBattle: showBattle,
        showTerritoryUnits: showTerritoryUnits,
        replaceCloseButton: replaceCloseButton
    }
});