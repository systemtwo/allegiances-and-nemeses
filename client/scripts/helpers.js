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

    return {
        phaseName: phaseName,
        getImageSource: getImageSource
    }
});