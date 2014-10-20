define(["nunjucks", "globals", "helpers"], function(nj, _g, _h) {
    // Distance from edge of board top left to the top left corner of camera
    var offset = {
        x: 0,
        y: 0
    };
    var singleBoardWidth = 2460;

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

    function selectableTerritories(territories){
        alert("Selectable territories: " + territories)
    }

    function createMap() {
        var canvas = document.getElementById("board");
        var dragging = false;
        var previous = {
            x: 0,
            y: 0
        };
        singleBoardWidth = _g.board.mapImage.width/2;

        function resizeBoard() {
            canvas.width = Math.max(window.innerWidth*0.8, 400);
            canvas.height = Math.max(window.innerHeight*0.8, 360);
            drawTNames();
        }

        resizeBoard();
        window.onresize = resizeBoard;
//        canvas.width = _g.board.mapImage.width;
//        canvas.height = _g.board.mapImage.height;

//        var secondClick = false, previous = {};
//        canvas.onclick = function(e) {
//            if (secondClick) {
//                secondClick = false;
//
//                if (window.currentTerritory) {
//                    var cache;
//                    _g.territoryCatalogue.forEach(function(t) {
//                        if (t.name == window.currentTerritory) {
//                            cache = t;
//                        }
//                    });
//                    cache.x = previous.x - canvas.offsetLeft;
//                    cache.y = previous.y - canvas.offsetTop;
//                    cache.width = e.pageX - previous.x;
//                    cache.height = e.pageY - previous.y;
//                    console.log(cache);
//                } else {
//                    _g.territoryCatalogue.push({
//                        name: prompt("Territory Name"),
//                        x: previous.x - canvas.offsetLeft,
//                        y: previous.y - canvas.offsetTop,
//                        width: e.pageX - previous.x,
//                        height: e.pageY - previous.y
//                    });
//                }
//                drawTNames();
//            } else {
//                previous.x = e.pageX;
//                previous.y = e.pageY;
//                secondClick = true;
//                drawTNames();
//            }
//        };

        $(canvas).mousemove(function (e) {
            e.preventDefault();
            var mousex = e.pageX - canvas.offsetLeft;
            var mousey = e.pageY - canvas.offsetTop;
            var boardCoord = {
                x: mousex + offset.x,
                y: mousey + offset.y
            };


            if (dragging) {
                offset.x -= e.pageX - previous.x;
                offset.y -= e.pageY - previous.y;
                previous.x = e.pageX;
                previous.y = e.pageY;
                drawTNames();
            }
            var t = territoryAtPoint(boardCoord.x, boardCoord.y);

            if (t && territoryIsSelectable(t)) {
                canvas.style.cursor = "pointer";
            } else {
                canvas.style.cursor = "auto";
            }
        });

        $(canvas).mousedown(function (e) {
            e.preventDefault();
            var mousex = e.pageX - canvas.offsetLeft;
            var mousey = e.pageY - canvas.offsetTop;
            var boardCoord = {
                x: mousex + offset.x,
                y: mousey + offset.y
            };

            var t = territoryAtPoint(boardCoord.x, boardCoord.y);

            if (t && territoryIsSelectable(t)) {
                selectTerritory(t)
            } else {
                dragging = true;
                previous.x = e.pageX;
                previous.y = e.pageY;
            }
        });

        $(document).mouseup(function (e) {
            dragging = false;
        });
        // test code
        window.globals = _g;
//        setTimeout(function(){
//            drawTNames();
//        }, 500)
    }

    function adjustOffset() {
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

    function territoryIsSelectable() {
        // return true if territory is in list of allowed
        return true;
    }

    function drawTNames() {
        adjustOffset();
        var canvas = document.getElementById("board");
        canvas.width = canvas.width; // Force redraw
        var ctx = canvas.getContext("2d");
        ctx.drawImage(_g.board.mapImage, -offset.x, -offset.y);
//        _g.territoryCatalogue.forEach(function(t) {
//            ctx.rect(t.x, t.y, t.width, t.height);
//        });
        ctx.stroke();
    }

    function showTerritoryList() {
        var windowContents = $(nj.render( "static/templates/tList.html", {territories: _g.territoryCatalogue}));

        windowContents.find("li").click(function(element) {
            var name = $(this).data("name");
            var cache;
            _g.territoryCatalogue.forEach(function(t) {
                if (t.name == name) {
                    cache = t;
                }
            });
            selectTerritory(cache)
        });

        windowContents.dialog({
            title: "Territories",
            modal: false,
            closeOnEscape: false,
            width: 600, // TODO base off of window width/user pref
            height: 500,
            buttons: {
                "Minimize": function () {
                    $(this).dialog("close");
                }
            }
        })
    }

    function selectTerritory (t){
        if (t.income === undefined) {
            t.income = prompt("Income for " + t.name)
        }
        window.currentTerritory = t;
    }

    function territoryAtPoint(x, y) {
        if (x > singleBoardWidth) {
            x = x - singleBoardWidth;
        }

        // Temporarily make up for trimming border
        x = x+20;
        y = y+20;
        for (var i=0; i<_g.territoryCatalogue.length; i++) {
            var t = _g.territoryCatalogue[i];
            if (t.x < x &&
                t.y < y &&
                t.x + t.width > x &&
                t.y + t.height > y) {
                return t;
            }
        }
    }
    return {
        showBattle: showBattle,
        showPlacementWindow: showPlacementWindow,
        showRecruitmentWindow: showRecruitmentWindow,
        createMap: createMap,
        showTerritoryList: showTerritoryList,
        selectableTerritories: selectableTerritories
    }
});