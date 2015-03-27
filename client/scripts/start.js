requirejs.config({
    baseUrl: 'static/scripts',
    paths: {
        "nunjucks": "lib/nunjucks",
        "backbone": "lib/backbone",
        "knockout": "lib/knockout-3.3.0.debug",
        "underscore": "lib/underscore",
        "jquery": "lib/jquery-1.11.1",
        "jquery-ui": "lib/jquery-ui-1.11.3/jquery-ui"
    }
});

// Start the main app logic.
requirejs(['board', "render", "dialogs", "router", "views/sidePanel/sidePanel", "lib/jqExt"],
function ( game, _render, _dialogs, _router, sidePanel) {
    _router.fetchBoards().done(function(boards) {
        _dialogs.showBoardList(boards, onBoardSelect);
    });

    function onBoardSelect(boardId, onSuccess) {
        _router.fetchBoard(boardId).done(function(boardInfo) {
            var board = new game.Game(boardId, boardInfo);

            console.time("Map Load");
            board.setImage(boardInfo.imagePath, function onMapLoad() {
                console.timeEnd("Map Load");
                _render.initMap();
            });
            var side = new sidePanel.SidePanel({
                el: $("#side-panel-container")
            });
            side.render();
            onSuccess(); // closes the dialog
        });
    }
});