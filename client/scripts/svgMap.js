define(["d3", "underscore", "backbone"],
function(d3, _, backbone) {
    var Map = function(mapInfo) {
        this.territories = mapInfo.territories;

        return this;
    };
    var proto = Map.prototype;
    _.extend(proto, backbone.Events);

    proto.drawTerritories = function (paths) {

    };

    proto.drawMap = function(territories) {

    };

    var testInfo = {
        territories: [
            {
                name: "uniqueName",
                displayName: "Display Name",
                income: 5,
                displayInfo: {
                    path: "M0,0 L10,10 L0,10 z",
                    name: [2, 2],
                    circle: [3, 4]
                }
            }
        ]
    }


});