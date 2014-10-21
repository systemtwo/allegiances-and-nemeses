define(["nunjucks", "globals", "helpers"], function(nj, _g, _h) {
    // Distance from edge of board top left to the top left corner of camera
    var offset = {
        x: 0,
        y: 0
    };

    function showRecruitmentWindow(buyPhase) {
        var sum = $("<span>").text(0);
        var windowContents = $(nj.render("static/templates/window.html", {units: _g.unitCatalogue })).prepend(sum);

        windowContents.find(".buyAmount").each(function(index, input) {
            input = $(input);
            var unitType = input.data("type");
            var info = _h.unitInfo(unitType);

            function getMax(){
                var remainingMoney = _g.currentCountry.ipc - buyPhase.money();
                var currentAmount = _g.buyList[unitType] ? _g.buyList[unitType].amount : 0;
                var newMax = Math.floor(remainingMoney/ info.cost) + currentAmount;
                if (newMax < 0) {
                    console.error("Spent more than allowed")
                }
                return newMax;
            }
            input.counter({
                min: 0,
                max: getMax,
                change: function () {
                    buyPhase.buyUnits(unitType, input.counter("value"));
                    sum.text(buyPhase.money())
                }
            });
        });

        windowContents.dialog({
            title: "Unit List",
            modal: false,
            closeOnEscape: false,
            width: 600, // TODO base off of window width/user pref
            height: 500, // TODO base off of window width/user pref
            buttons: {
                "Ok": function () {
                    _g.currentPhase.nextPhase();
                    $(this).dialog("close");
                },
                "Minimize": function () {
                    $(this).dialog("close");
                }
            }
        })

    }

    /**
     * Shows the list of units bought, indicates which are available to be placed, and which have already been placed
     */
    function showPlacementWindow() {

    }
    function showBattle(conflict) {

    }

    function initMap() {
        var canvas = document.getElementById("board");

        function resizeBoard() {
            canvas.width = Math.max(window.innerWidth*0.8, 400);
            canvas.height = Math.max(window.innerHeight*0.8, 360);
            drawMap();
        }

        resizeBoard();
        window.onresize = resizeBoard;

        listenToMap(canvas);

        // test code
        window.globals = _g;
    }

    function listenToMap(canvas) {
        var dragging = false;
        // Previous mouse pageX and pageY
        var previous = {
            x: 0,
            y: 0
        };

        $(canvas).mousemove(function (e) {
            e.preventDefault();
            var boardCoord = boardCoordinates(e);

            if (dragging) {
                // Move the map
                offset.x -= e.pageX - previous.x;
                offset.y -= e.pageY - previous.y;
                previous.x = e.pageX;
                previous.y = e.pageY;
                drawMap();
            }
            var t = _h.territoryAtPoint(boardCoord.x, boardCoord.y);

            if (t && _h.territoryIsSelectable(t)) {
                canvas.style.cursor = "pointer";
            } else {
                canvas.style.cursor = "auto";
            }
        });

        $(document).mouseup(function () {
            dragging = false;
        });

        $(canvas).mousedown(function (e) {
            e.preventDefault();
            var boardCoord = boardCoordinates(e);

            var t = _h.territoryAtPoint(boardCoord.x, boardCoord.y);

            if (t && _h.territoryIsSelectable(t)) {
                // pass to phase controller
            } else {
                dragging = true;
                previous.x = e.pageX;
                previous.y = e.pageY;
            }
        });
    }

    function boardCoordinates(event) {
        var canvas = document.getElementById("board");
        return {
                x: event.pageX - canvas.offsetLeft + offset.x,
                y: event.pageY - canvas.offsetTop + offset.y
            };
    }

    function adjustOffset() {
        var singleBoardWidth = _g.board.mapImage.width/2;
        var canvas = document.getElementById("board");
        if (offset.x < 0) {
            console.log("less than");
            offset.x += singleBoardWidth;
        } else if (offset.x + canvas.width > 2*singleBoardWidth) {
            console.log("x greater than");
            offset.x -= singleBoardWidth;
        }
        if (offset.y < 0) {
            offset.y = 0;
            console.log("y less than");
        } else if (offset.y + canvas.height > _g.board.mapImage.height) {
            console.log("y greater than");
            offset.y =  _g.board.mapImage.height - canvas.height;
        }

    }

    function drawMap() {
        adjustOffset();
        var canvas = document.getElementById("board");
        canvas.width = canvas.width; // Force redraw
        var ctx = canvas.getContext("2d");
        ctx.drawImage(_g.board.mapImage, -offset.x, -offset.y);
    }

    return {
        showBattle: showBattle,
        showPlacementWindow: showPlacementWindow,
        showRecruitmentWindow: showRecruitmentWindow,
        initMap: initMap,
        drawMap: drawMap
    }
});