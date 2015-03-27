define(["gameAccessor"], function(_b) {
    var exports = {};
    /**
     * Sets phase name/description of current phase
     * @param name
     */
    exports.phaseName = function(name) {
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
        return "static/images/" + unitType + ".png";
    };

    return exports;
});