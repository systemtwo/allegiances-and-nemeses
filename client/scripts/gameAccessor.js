// DO NOT REQUIRE ANYTHING
// globals.js should have no dependencies, so it can be required from any file
define(function() {
    var board = null;
    return {
        getBoard: function() {
            if (!board) {
                throw Error("Board not initialized yet")
            }
            return board;
        },
        setBoard: function(newBoard) {
            board = newBoard;
        }
    };
});