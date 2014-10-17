define(["nunjucks"], function(nj) {
    function showRecruitmentWindow() {
        var windowContents = nj.render("../templates/window.html", [{unitType: "Lich"}])
        alert(windowContents)
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
        showRecruitmentWindow: showRecruitmentWindow
    }
});