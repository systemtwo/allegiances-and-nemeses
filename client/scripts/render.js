define(["nunjucks"], function(nj) {
    function showRecruitmentWindow() {
        var windowContents = $(nj.render("static/templates/window.html", {units: [{unitType: "Lich"}] }));

        windowContents.find(".buyAmount").spinner({
            min: 0
        });

        windowContents.dialog({
            title: "Unit List",
            modal: false,
            width: 600, // TODO base off of window width/user pref
            buttons: {
                "Ok": function () {
                    $(this).dialog("close");
                },
                "Minimize": function () {
                    $(this).dialog("close");
                }
            }
        })

    }

    /**
     * Shows the list of units bought, indicates which are available to be placed, and which have already been placed
     */
    function showPlacementWindow() {

    }
    function showBattle(conflict) {

    }

    function selectableTerritories(territories){
        alert("Selectable territories: " + territories)
    }

    return {
        showBattle: showBattle,
        showPlacementWindow: showPlacementWindow,
        showRecruitmentWindow: showRecruitmentWindow,
        selectableTerritories: selectableTerritories
    }
});