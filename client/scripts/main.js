


requirejs.config({
    baseUrl: './'
//    paths: {
//        specialName: '../customPath/fileName'
//    }
});

// Start the main app logic.
requirejs(["globals", 'board'],
function (_g, board) {
    _g.board = new board.Board()
});