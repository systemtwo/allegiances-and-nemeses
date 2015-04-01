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
            create: replaceCloseButton,
            width: 600,
            height: 400
        });
    }

    return {
        showConflictList: showConflictList,
        closeConflicts: closeConflicts,
        showBattle: showBattle
    }
});