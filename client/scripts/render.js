define(["gameAccessor", "helpers", "router"], function(_b, _h, _router) {
    // TODO replace nj with ko

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

    function initMap() {
        var canvas = document.getElementById("board");

        function resizeBoard() {
            canvas.width = Math.min(window.innerWidth*0.8, _b.getBoard().getMapWidth());
            canvas.height = Math.min(window.innerHeight*0.8, _b.getBoard().mapImage.height);
            drawMap();
        }

        resizeBoard();
        window.onresize = resizeBoard;

        listenToMap(canvas);
    }


    // Attaches mouse listeners to the canvas element
    function listenToMap(canvas) {
        var dragging = false;
        var blockContextMenu = false; // flag to block menu ONCE

        $(canvas).mousemove(function (e) {
            e.preventDefault();
            if (dragging) {
                // Move the map
                offset.x -= e.pageX - previousMouse.x;
                offset.y -= e.pageY - previousMouse.y;
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

        $(document).on("contextmenu", function(e) {
            if (blockContextMenu) {
                e.preventDefault();
                blockContextMenu = false;
            }
        });

        $(canvas).mousedown(function onMapClick(e) {
            e.preventDefault();
            // Don't do anything if dragging
            if (e.button == "2") {
                dragging = true;
                blockContextMenu = true;

                previousMouse.x = e.pageX;
                previousMouse.y = e.pageY;
                return false;
            }
            previousMouse.x = e.pageX;
            previousMouse.y = e.pageY;
        });
    }

    function onTerritoryClick(t) {
        if (t && territoryIsSelectable(t)) {
            // pass to phase controller
            if (_b.getBoard().currentPhase && _b.getBoard().currentPhase.onTerritorySelect) {
                _b.getBoard().currentPhase.onTerritorySelect(t);
            }
        } else {
            if (_b.getBoard().currentPhase && _b.getBoard().currentPhase.clickNothing) {
                _b.getBoard().currentPhase.clickNothing();
            }
        }
    }

    // Keeps the offset within reasonable bounds
    function adjustOffset() {
        var singleBoardWidth = _b.getBoard().getMapWidth();
        var canvas = document.getElementById("board");
        if (_b.getBoard().wrapsHorizontally) {
            if (offset.x < 0) {
                offset.x += singleBoardWidth;
            } else if (offset.x + canvas.width > 2 * singleBoardWidth) {
                offset.x -= singleBoardWidth;
            }
        }  else {
            if (offset.x < 0) {
                offset.x = 0;
            } else if (offset.x + canvas.width > singleBoardWidth) {
                offset.x = singleBoardWidth - canvas.width;
            }
        }
        if (offset.y < 0) {
            offset.y = 0;
        } else if (offset.y + canvas.height > _b.getBoard().mapImage.height) {
            offset.y =  _b.getBoard().mapImage.height - canvas.height;
        }

    }

    var arrowOrigin = null;
    function showArrowFrom(t) {
        arrowOrigin = t;
        drawMap();
    }
    function hideArrow() {
        arrowOrigin = null;
        drawMap();
    }

    // Draws the map image, and then any additional stuff on top
    var showSkeleton;
    function setShowSkeleton(bool) {
        showSkeleton = bool;
    }
    // Firefox bug workaround
    function ffDrawImage(onSuccess) {
        var canvas = document.getElementById("board");
        var ctx = canvas.getContext("2d");
        try {
            ctx.drawImage(_b.getBoard().mapImage, -offset.x, -offset.y);
            onSuccess();
        } catch (e) {
            if (e.name == "NS_ERROR_NOT_AVAILABLE") {
                // Wait a bit before trying again; you may wish to change the
                // length of this delay.
                setTimeout(function() {
                    ffDrawImage(onSuccess)
                }, 100);
            } else {
                throw e;
            }
        }
    }

    function drawMap() {
        adjustOffset();
        var canvas = document.getElementById("board");
        canvas.width = canvas.width; // Force redraw
        var ctx = canvas.getContext("2d");
        ffDrawImage(function onSuccess() {
            // Draw a line from a territory to the mouse
            if (arrowOrigin) {
                var origin = {
                    x: arrowOrigin.x + arrowOrigin.width/2,
                    y: arrowOrigin.y + arrowOrigin.height/2
                };
                var end = {
                    x: previousMouse.x - canvas.offsetLeft + offset.x,
                    y: previousMouse.y - canvas.offsetTop + offset.y
                };
                if (end.x > _b.getBoard().getMapWidth) {
                    end.x -= _b.getBoard().getMapWidth();
                }
                drawLine(origin, end);
            }
            if (showSkeleton) {
                _b.getBoard().info.connections.forEach(function (c) {
                    drawLine(c[0], c[1])
                });
            }

            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = 'yellow';
            selectableTerritories.forEach(function(t) {
                // TODO highlight selectable
            });
            ctx.restore();
        });
    }

    // begin and end just need x and y in board coordinates
    function drawLine(begin, end) {
        var singleMapWidth = _b.getBoard().getMapWidth();
        var canvas = document.getElementById("board");
        var ctx = canvas.getContext("2d");
        var beginX = (begin.x + begin.width/2 || begin.x) - offset.x;
        var beginY = (begin.y + begin.height/2 || begin.y) - offset.y;
        var endX = (end.x + end.width/2 || end.x) - offset.x;
        var endY = (end.y + end.height/2 || end.y) - offset.y;

        var crossBorder = Math.abs(beginX - endX) > singleMapWidth*3/4;
        // Make coordinates in drawable bounds, since map can wrap around
        if (beginX < 0 && endX < 0) {
            beginX += singleMapWidth;
            endX += singleMapWidth;
        } else if (beginX > canvas.width && endX > canvas.width) {
            beginX -= singleMapWidth;
            endX -= singleMapWidth;
        }

        // Canvas draws crossBorder lines on the left board
        // Find the point farthest to the left, move it one board to the right
        if (crossBorder) {
            if (beginX < endX) {
                beginX += singleMapWidth;
            } else {
                endX += singleMapWidth;
            }
        }
        ctx.beginPath();
        ctx.moveTo(beginX, beginY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    var selectableTerritories = [];
    function setSelectableTerritories(territories) {
        selectableTerritories = territories;
        drawMap();
    }
    function setTerritoriesWithUnitsSelectable(units) {
        //unique list of all the territories the current country has units in
        var territories = [];
        var territoryNames = {};
        units.forEach(function(u) {
            if (!(u.territory.name in territoryNames)) {
                territoryNames[u.territory.name] = true;
                territories.push(u.territory)
            }
        });
        setSelectableTerritories(territories);
    }

    function territoryIsSelectable(t) {
        return selectableTerritories.indexOf(t) !== -1;
    }
    return {
        initMap: initMap,
        drawMap: drawMap,
        drawLine: drawLine,
        offset: offset,
        showArrowFrom: showArrowFrom,
        hideArrow: hideArrow,
        showSkeleton: setShowSkeleton,
        setSelectableTerritories: setSelectableTerritories,
        setTerritoriesWithUnitsSelectable: setTerritoriesWithUnitsSelectable,
        territoryIsSelectable: territoryIsSelectable
    }
});