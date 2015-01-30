// DO NOT REQUIRE ANYTHING
// globals.js should have no dependencies, so it can be required from any file
define(function() {
    var returnObject = {
        board: null,
        currentCountry: null,
        currentPhase: null,
        unitCatalogue: {},
        imageMap: {},
        buyList: [],
        conflicts: [],
        connections: [] // List of all the connections between territories. Used for rendering for now. Ask dschwarz
    };
    returnObject.getBoard = function() {
        if (!returnObject.board) {
            throw Error("Board not initialized yet")
        }
        return returnObject.board;
    };

    return returnObject;
});