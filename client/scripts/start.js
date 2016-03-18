requirejs.config({
    baseUrl: '/static/scripts',
    paths: {
        "backbone": "lib/backbone",
        "knockout": "lib/knockout-3.3.0.debug",
        "underscore": "lib/underscore",
        "jquery": "lib/jquery-1.11.1",
        "jquery-ui": "lib/jquery-ui-1.11.3/jquery-ui",
        "sockjs": "lib/sockjs"
    }
});

// Start the main app logic.
requirejs(['board', "dialogs", "router", "sockjs", "views/sidePanel/sidePanel", "jquery-ui", "lib/ko.extensions"],
function ( game, _dialogs, _router, SockJS, sidePanel) {
    var pathParts = window.location.pathname.split("/");
    var boardId = pathParts[pathParts.length - 1];
    _router.fetchBoard(boardId).done(function(boardInfo) {
        var board = new game.Game(boardId, boardInfo, "#board");
        var side = new sidePanel.SidePanel({
            el: $("#side-panel-container")
        });
        side.render();

        var sock = new SockJS('/gameStream?gameId=' + encodeURIComponent(boardId));
        sock.onopen = function() {
            console.log('open');
        };
        sock.onmessage = function(e) {
            var data = e.data;
            if (data.type == "message") {
                console.log('message', data.payload);
            } else if (data.type == 'gameUpdate') {
                board.parse(data.payload);
            } else {
                throw new Error("Invalid message type")
            }
        };
        sock.onclose = function() {
            console.log('close');
        };
        sock.send("test")
    });
});