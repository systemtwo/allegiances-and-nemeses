define(["nunjucks"], function(nj) {
    function showRecruitmentWindow() {
        var windowContents = nj.render("static/templates/window.html", {units: [{unitType: "Lich"}] });

        $(windowContents).dialog()

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