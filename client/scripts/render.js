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
                drawMap();
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
                dragging = true;
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
        var singleMapWidth = _g.board.mapImage.width/2;
        adjustOffset();
        var canvas = document.getElementById("board");
        canvas.width = canvas.width; // Force redraw
        var ctx = canvas.getContext("2d");
        ctx.drawImage(_g.board.mapImage, -offset.x, -offset.y);

        if (arrowOrigin) {
            var origin = {
                x: arrowOrigin.x + arrowOrigin.width/2 - offset.x,
                y: arrowOrigin.y + arrowOrigin.height/2 - offset.y
            };

            if (origin.x < 0) {
                origin.x += singleMapWidth;
            } else if (origin.x > canvas.width && origin.x > singleMapWidth) {
                origin.x -= singleMapWidth;
            }

            // Needed until territory name locations are updated (off by 20px, 20px due to removing map border)
            origin.x -= 20;
            origin.y -= 20;
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(previousMouse.x - canvas.offsetLeft, previousMouse.y - canvas.offsetTop);
            ctx.stroke();
        }
    }

    return {
        phaseName: phaseName,
        showBattle: showBattle,
        showPlacementWindow: showPlacementWindow,
        showRecruitmentWindow: showRecruitmentWindow,
        showMoveWindow: showMoveWindow,
        initMap: initMap,
        drawMap: drawMap,
        showArrowFrom: showArrowFrom,
        hideArrow: hideArrow
    }
});