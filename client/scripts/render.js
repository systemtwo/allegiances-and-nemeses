define(["nunjucks", "globals", "helpers"], function(nj, _g, _h) {
    function showRecruitmentWindow() {
        var windowContents = $(nj.render("static/templates/window.html", {units: _g.unitCatalogue }));

        function changeUnitAmount(unitType, amount) {
            // Should to a check to make sure we're still in the buy phase
            _g.currentPhase.buyUnits(unitType, amount);
            var remainingMoney = _g.currentCountry.ipc - _g.currentPhase.money();
            windowContents.find(".buyAmount").each(function(index, spinner) {
                spinner = $(spinner);
                var info = _h.unitInfo(spinner.data("type"));
                var newMax = Math.floor(remainingMoney/ info.cost);
                if (newMax <0) {
                    console.error("Spent more than allowed")
                }
                spinner.spinner("option", "max", newMax)
            })
        }

        windowContents.find(".buyAmount").each(function(index, input) {
            var spinner = $(input);
            var unitType = spinner.data("type");
            var max = Math.floor(_g.currentCountry.ipc/_h.unitInfo(unitType).cost);
            spinner.spinner({
                min: 0,
                max: max,
                change: function () {
                    changeUnitAmount(unitType, this.value);
                }
            });
        });

        windowContents.dialog({
            title: "Unit List",
            modal: false,
            width: 600, // TODO base off of window width/user pref
            buttons: {
                "Ok": function () {
                    _g.currentPhase.nextPhase();
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