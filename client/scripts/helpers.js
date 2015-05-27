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

    exports.getImageSource = function(unitInfo, country) {
        if (_.isObject(country)) {
            country = country.name;
        }
        var source = unitInfo.imageSource[country];
        if (source) {
            return "/static/images/" + source;
        } else {
            return "";
        }
    };

    function friendlySeaTerritory (sea, country) {
        return sea.enemyUnits(country).length == 0;
    }

    /**
     * Returns true if a is allied to b
     * @param a {Unit|Territory|Country}
     * @return {boolean}
     */
    exports.allied = function(a, b) {
        if (a.country) a = a.country;
        if (b.country) b = b.country;

        // Handle sea territories
        if (!a.team) {
            return friendlySeaTerritory(a, b);
        } else if (!b.team) {
            return friendlySeaTerritory(b, a);
        } else {
            // standard case - compare two countries
            return a.team == b.team;
        }
    };

    return exports;
});