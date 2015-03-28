define(["gameAccessor", "helpers", "router"], function(_asdf, _h, _router) {
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
            canvas.width = Math.min(window.innerWidth*0.8, _asdf.getBoard().getMapWidth());
            canvas.height = Math.min(window.innerHeight*0.8, _asdf.getBoard().mapImage.height);
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
            var boardCoord = boardCoordinates(e);

            if (dragging) {
                // Move the map
                offset.x -= e.pageX - previousMouse.x;
                offset.y -= e.pageY - previousMouse.y;
            }
            var t = territoryAtPoint(boardCoord.x, boardCoord.y);

            if (t && territoryIsSelectable(t)) {
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
            var boardCoord = boardCoordinates(e);

            var t = territoryAtPoint(boardCoord.x, boardCoord.y);

            if (t && territoryIsSelectable(t)) {
                // pass to phase controller
                if (_asdf.getBoard().currentPhase && _asdf.getBoard().currentPhase.onTerritorySelect) {
                    _asdf.getBoard().currentPhase.onTerritorySelect(t);
                }
            } else {
                if (_asdf.getBoard().currentPhase && _asdf.getBoard().currentPhase.clickNothing) {
                    _asdf.getBoard().currentPhase.clickNothing();
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

    // Keeps the offset within reasonable bounds
    function adjustOffset() {
        var singleBoardWidth = _asdf.getBoard().getMapWidth();
        var canvas = document.getElementById("board");
        if (_asdf.getBoard().wrapsHorizontally) {
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
        } else if (offset.y + canvas.height > _asdf.getBoard().mapImage.height) {
            offset.y =  _asdf.getBoard().mapImage.height - canvas.height;
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
            ctx.drawImage(_asdf.getBoard().mapImage, -offset.x, -offset.y);
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
                if (end.x > _asdf.getBoard().mapImage.width/2) {
                    end.x -= _asdf.getBoard().mapImage.width/2;
                }
                drawLine(origin, end);
            }
            if (showSkeleton) {
                _asdf.getBoard().boardData.territories.forEach(function(t) {
                    drawRect(t.x, t.y, t.width, t.height);
                });
                ctx.stroke();

                _asdf.getBoard().info.connections.forEach(function (c) {
                    drawLine(c[0], c[1])
                });
            }

            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = 'yellow';
            selectableTerritories.forEach(function(t) {
                drawArc(t.x + t.width/2, t.y + t.height/2, t.width*1.2, t.height*1.2, true);
            });
            ctx.restore();
        });
    }

    // begin and end just need x and y in board coordinates
    function drawLine(begin, end) {
        var singleMapWidth = _asdf.getBoard().mapImage.width/2;
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

    // Must call ctx.stroke() after all the calls to this function
    function drawRect(x, y, width, height) {
        x -= offset.x;
        y -= offset.y;
        var canvas = document.getElementById("board");
        var ctx = canvas.getContext("2d");
        var singleMapWidth = _asdf.getBoard().mapImage.width/2;

        if (x + width < 0) {
            x += singleMapWidth;
        } else if (x > canvas.width && x > singleMapWidth) {
            x -= singleMapWidth;
        }

        ctx.rect(x, y, width, height);
    }

    function drawArc(centerX, centerY, width, height, fill) {
        fill = fill || false;
        var ratio = height/width;
        var singleMapWidth = _asdf.getBoard().mapImage.width/2;
        var canvas = document.getElementById("board");
        var ctx = canvas.getContext("2d");
        centerX -= offset.x;
        centerY -= offset.y;

        if (_asdf.getBoard().wrapsHorizontally) {
            // Right side of circle past canvas left side
            if (centerX + width/2 < 0) {
                centerX += singleMapWidth;
            } else if (centerX - width/2 > canvas.width) { // Left side past canvas right side
                centerX -= singleMapWidth;
            }
        }
        ctx.save();
        ctx.scale(1, ratio); // Scale the height
        ctx.beginPath();
        ctx.arc(centerX,centerY/ratio,width/2,0,2*Math.PI);
        if (fill) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
        ctx.restore();
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
    function territoryAtPoint(x, y) {
        var singleBoardWidth = _asdf.getBoard().getMapWidth();
        if (_asdf.getBoard().wrapsHorizontally) {
            if (x > singleBoardWidth) {
                x = x - singleBoardWidth;
            }
        }

        var territoryList = _asdf.getBoard().boardData.territories;
        for (var i=0; i<territoryList.length; i++) {
            var t = territoryList[i];
            if (t.x < x &&
                t.y < y &&
                t.x + t.width > x &&
                t.y + t.height > y) {
                return t;
            }
        }
    }
    return {
        initMap: initMap,
        drawMap: drawMap,
        drawRect: drawRect,
        drawLine: drawLine,
        offset: offset,
        showArrowFrom: showArrowFrom,
        hideArrow: hideArrow,
        showSkeleton: setShowSkeleton,
        setSelectableTerritories: setSelectableTerritories,
        setTerritoriesWithUnitsSelectable: setTerritoriesWithUnitsSelectable,
        territoryIsSelectable: territoryIsSelectable,
        territoryAtPoint: territoryAtPoint
    }
});