requirejs.config({
    baseUrl: '../scripts/'
//    paths: {
//        specialName: '../customPath/fileName'
//    }
});

// Start the main app logic.
requirejs(["globals", 'board', "phases"],
function (_g, board, _p) {
    _g.board = new board.Board();
    _g.currentCountry = {
        name: "russia",
        team: "vodka",
        ipc: 27
    };
    _g.currentPhase = _p.BuyPhase();
});