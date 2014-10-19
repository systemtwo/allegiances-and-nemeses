define(["nunjucks", "globals", "helpers"], function(nj, _g, _h) {
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
        var secondClick = false, previous = {};
        var canvas = document.getElementById("board");
        var ctx = canvas.getContext("2d");
//        canvas.width = Math.max(window.innerWidth*0.8, 400);
//        canvas.height = Math.max(window.innerHeight*0.8, 360);
        canvas.width = _g.board.mapImage.width;
        canvas.height = _g.board.mapImage.height;
        ctx.drawImage(_g.board.mapImage, 0, 0);

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
            var mousex = e.pageX - canvas.offsetLeft;
            var mousey = e.pageY - canvas.offsetTop;

            var t = territoryAtPoint(mousex, mousey);

            if (t) {
                canvas.style.cursor = "pointer";
            } else {
                canvas.style.cursor = "auto";
            }
        });

        window.globals = _g;
        setTimeout(function(){
        drawTNames();
        }, 500)
    }

    function drawTNames() {
        var canvas = document.getElementById("board");
        canvas.width = canvas.width;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(_g.board.mapImage, 0, 0);
        _g.territoryCatalogue.forEach(function(t) {
            ctx.rect(t.x, t.y, t.width, t.height);
        });
        ctx.stroke();
    }

    function showTerritoryList() {
        var windowContents = $(nj.render( "static/templates/tList.html", {territories: _g.territoryCatalogue}));

        windowContents.find("li").click(function(element) {
            window.currentTerritory = $(this).data("name");
            var cache;
            _g.territoryCatalogue.forEach(function(t) {
                if (t.name == window.currentTerritory) {
                    cache = t;
                }
            });
            if (cache.income === undefined) {
                cache.income = prompt("Income for " + window.currentTerritory)
            }
        });

        windowContents.dialog({
            title: "Territories",
            modal: false,
            closeOnEscape: false,
            width: 600, // TODO base off of window width/user pref
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

    function territoryAtPoint(x, y) {
        console.log("Begin");
        for (var i=0; i<_g.territoryCatalogue.length; i++) {
            var t = _g.territoryCatalogue[i];
            if (t.x < x &&
                t.y < y &&
                t.x + t.width > x &&
                t.y + t.height > y) {
                return t;
            }
        }
        console.log("end")
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