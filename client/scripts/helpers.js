define(["enums"], function(enums) {
    var exports = {};
    /**
     * Sets phase name/description of current phase
     * @param constructorName The name of the phase
     */
    exports.phaseName = function(constructorName) {
        var name = enums.phaseDisplayNames[constructorName] || "Unknown Phase";
        $("#phaseName").text("| " + name);
    };

    exports.countryName = function(name) {
        $("#countryName").text("| " + name);
    };

    exports.helperText = function(text) {
        text = text ? "- " + text : "";
        $("#helperText").text(text);
    };

    exports.getImageSource = function(unitType, country) {
        return "/static/images/" + unitType + ".png";
    };

    return exports;
});