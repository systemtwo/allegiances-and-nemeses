define(["gameAccessor"], function(_b) {
    /**
     * Sets phase name/description of current phase
     * @param name
     */
    function phaseName(name) {
        $("#phaseName").text("| " + name);
    }

    function getImageSource(unitType, country) {
        return "static/images/" + unitType + ".png";
    }

    function nextPhaseButtonVisible(visibleFlag) {
        $("#nextPhase").toggle(visibleFlag);
    }

    function bindPhaseButton() {
        $("#nextPhase").click(function onNextPhaseClick() {
            _b.getBoard().currentPhase.nextPhase();
        });
    }

    return {
        phaseName: phaseName,
        nextPhaseButtonVisible: nextPhaseButtonVisible,
        bindPhaseButton: bindPhaseButton,
        getImageSource: getImageSource
    }
});