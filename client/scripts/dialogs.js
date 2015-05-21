define(["knockout", "gameAccessor", "text!../templates/battleground.ko.html", "helpers"], function(ko, _b, battlefieldTemplate, _helpers) {

    function replaceCloseButton(event, ui) {
        var widget = $(this).dialog("widget");
        $(".ui-dialog-titlebar-close", widget).remove();
        $(".ui-dialog-titlebar", widget).append(
            $("<span>")
                .addClass("glyphicon glyphicon-remove close-icon")
                .click(function () {
                    widget.remove();
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
            getImageSrc: _helpers.getImageSource,
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

    return {
        showBattle: showBattle
    }
});