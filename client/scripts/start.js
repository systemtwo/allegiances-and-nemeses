requirejs.config({
    baseUrl: 'static/scripts',
    paths: {
        "nunjucks": "lib/nunjucks"
    },
    shim: {
        "jQuery-ui": {
            exports: "$",
            deps: "jQuery"
        }
    }
});

// Start the main app logic.
requirejs(["gameAccessor", 'board', "render", "dialogs", "router", "phases/phaseHelper"],
function (_b, game, _render, _dialogs, _router, _phaseHelper) {
    _router.fetchBoards().done(function(boards) {
        _dialogs.showBoardList(boards, onBoardSelect);
    });

    function onBoardSelect(boardId, onSuccess) {
        _router.fetchBoard(boardId).done(function(boardInfo) {
            var board = new game.Game(boardId, boardInfo);
            _b.setBoard(board);
            board.currentPhase = _phaseHelper.createPhase(boardInfo.currentPhase);

            console.time("Map Load");
            board.setImage(boardInfo.imagePath, function onMapLoad() {
                console.timeEnd("Map Load");
                _render.initMap();
            });
            onSuccess(); // closes the dialog
        });
    }
});