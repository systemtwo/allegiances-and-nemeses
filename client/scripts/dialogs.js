define(["nunjucks", "gameAccessor", "router", "helpers"], function(nj, _b, _router, _helpers) {

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
            create: replaceCloseButton,
            width: 600,
            height: 400
        });
    }

    return {
        showBattle: showBattle
    }
});