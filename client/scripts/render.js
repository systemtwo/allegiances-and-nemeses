define(["nunjucks", "globals", "helpers"], function(nj, _g, _h) {
    // Distance from edge of board top left to the top left corner of camera
    var offset = {
        x: 0,
        y: 0
    };
    // Previous mouse pageX and pageY
    var previousMouse = {
        x: 0,
        y: 0
    };

    function phaseName(name) {
        $("#phaseName").text("| " + name);
    }

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

    /**
     * Shows the list of units that can be moved, and which territories they come from.
     */
    var moveWindow = null;
    function showMoveWindow(enabledUnits, disabledUnits) {
        disabledUnits = disabledUnits || []; // optional parameter

        var territoryDict = {};
        enabledUnits.concat(disabledUnits).forEach(function(u) {
            if (u.territory.name in territoryDict) {
                territoryDict[u.territory.name].push(u);
            } else {
                territoryDict[u.territory.name] = [u];
            }
        });

        var territoryList = Object.keys(territoryDict).map(function(key) {
           return {
               name: key,
               units: territoryDict[key]
           };
        });

        var windowContents = $(nj.render("static/templates/moveUnits.html", {territories: territoryList}));


        windowContents.dialog({
            title: "Move Units",
            modal: false,
            width: 600, // TODO base off of window width/user pref
            height: 500, // TODO base off of window width/user pref
            buttons: {
                "Move": function () {
                    _g.currentPhase.nextPhase();
                    $(this).dialog("close");
                },
                "Cancel": function () {
                    $(this).dialog("close");
                }
            }
        })
    }

    function showBattle(conflict) {

    }

    function initMap(drawMapFunction) {
        drawMapFunction = drawMapFunction || drawMap;
        var canvas = document.getElementById("board");

        function resizeBoard() {
            canvas.width = Math.max(window.innerWidth*0.8, 400);
            canvas.height = Math.max(window.innerHeight*0.8, 360);
            drawMapFunction();
        }

        resizeBoard();
        window.onresize = resizeBoard;

        listenToMap(canvas, drawMapFunction);

        // test code
        window.globals = _g;
    }

    function listenToMap(canvas, drawMapFunction) {
        var dragging = false;

        $(canvas).mousemove(function (e) {
            e.preventDefault();
            var boardCoord = boardCoordinates(e);

            if (dragging) {
                // Move the map
                offset.x -= e.pageX - previousMouse.x;
                offset.y -= e.pageY - previousMouse.y;
            }
            var t = _h.territoryAtPoint(boardCoord.x, boardCoord.y);

            if (t && _h.territoryIsSelectable(t)) {
                canvas.style.cursor = "pointer";
            } else {
                canvas.style.cursor = "auto";
            }

            previousMouse.x = e.pageX;
            previousMouse.y = e.pageY;
            if (dragging || arrowOrigin) {
                drawMapFunction();
            }
        });

        $(document).mouseup(function () {
            dragging = false;
        });

        $(canvas).mousedown(function onMapClick(e) {
            e.preventDefault();
            var boardCoord = boardCoordinates(e);

            var t = _h.territoryAtPoint(boardCoord.x, boardCoord.y);

            if (t && _h.territoryIsSelectable(t)) {
                // pass to phase controller
                if (_g.currentPhase && _g.currentPhase.onTerritorySelect) {
                    _g.currentPhase.onTerritorySelect(t);
                }
            } else {
                if (_g.currentPhase && _g.currentPhase.clickNothing) {
                    _g.currentPhase.clickNothing();
                }
                if (e.shiftKey) {
                    dragging = true;
                }
            }
            previousMouse.x = e.pageX;
            previousMouse.y = e.pageY;
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

    var arrowOrigin = null;
    function showArrowFrom(t) {
        arrowOrigin = t;
        drawMap();
    }
    function hideArrow(t) {
        arrowOrigin = null;
        drawMap();
    }

    function drawMap() {
        adjustOffset();
        var canvas = document.getElementById("board");
        canvas.width = canvas.width; // Force redraw
        var ctx = canvas.getContext("2d");
        ctx.drawImage(_g.board.mapImage, -offset.x, -offset.y);
        if (arrowOrigin) {
            var origin = {
                x: arrowOrigin.x + arrowOrigin.width/2,
                y: arrowOrigin.y + arrowOrigin.height/2
            };
            var end = {
                x: previousMouse.x - canvas.offsetLeft + offset.x,
                y: previousMouse.y - canvas.offsetTop + offset.y
            };
            drawLine(origin, end);
        }
    }

    // begin and end just need x and y in board coordinates
    function drawLine(begin, end) {
        var singleMapWidth = _g.board.mapImage.width/2;
        var canvas = document.getElementById("board");
        var ctx = canvas.getContext("2d");
        var beginX = (begin.x + begin.width/2 || begin.x) - offset.x;
        var beginY = (begin.y + begin.height/2 || begin.y) - offset.y;
        var endX = (end.x + end.width/2 || end.x) - offset.x;
        var endY = (end.y + end.height/2 || end.y) - offset.y;

        // Make coordinates in drawable bounds, since map can wrap around
        if (beginX < 0 && endX < 0) {
            beginX += singleMapWidth;
            endX += singleMapWidth;
        } else if (beginX > canvas.width && endX > canvas.width) {
            beginX -= singleMapWidth;
            endX -= singleMapWidth;
        }
        ctx.beginPath();
        ctx.moveTo(beginX, beginY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    function drawRect(x, y, width, height) {
        x -= offset.x;
        y -= offset.y;
        var canvas = document.getElementById("board");
        var ctx = canvas.getContext("2d");
        var singleMapWidth = _g.board.mapImage.width/2;

        if (x + width < 0) {
            x += singleMapWidth;
        } else if (x > canvas.width && x > singleMapWidth) {
            x -= singleMapWidth;
        }

        ctx.rect(x, y, width, height);
    }

    return {
        phaseName: phaseName,
        showBattle: showBattle,
        showPlacementWindow: showPlacementWindow,
        showRecruitmentWindow: showRecruitmentWindow,
        showMoveWindow: showMoveWindow,
        initMap: initMap,
        drawMap: drawMap,
        drawRect: drawRect,
        drawLine: drawLine,
        offset: offset,
        showArrowFrom: showArrowFrom,
        hideArrow: hideArrow
    }
});