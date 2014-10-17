// DO NOT REQUIRE ANYTHING
// globals.js should have no dependencies, so it can be required from any file
define(function() {
    var returnObject = {
        board: null,
        currentCountry: null,
        currentPhase: null,
        buyList: []
    };
    returnObject.getBoard = function() {
        if (!returnObject.board) {
            throw Error("Board not initialized yet")
        }
        return returnObject.board;
    };

    return returnObject;
});