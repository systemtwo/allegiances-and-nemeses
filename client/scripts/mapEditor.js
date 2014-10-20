define(["nunjucks", "globals", "render"], function(nj, _g, _r) {

    var secondClick = false, previous = {};
    // Override the click handler on the canvas element with this function, when in map editor mode
    function mapClick(e) {
        var canvas = document.getElementById("board");
        if (secondClick) {
            secondClick = false;

            if (window.currentTerritory) {
                window.currentTerritory.x = previous.x - e.offsetLeft;
                window.currentTerritory.y = previous.y - canvas.offsetTop;
                window.currentTerritory.width = e.pageX - previous.x;
                window.currentTerritory.height = e.pageY - previous.y;
            } else {
                _g.board.territories.push({
                    name: prompt("Territory Name"),
                    x: previous.x - canvas.offsetLeft,
                    y: previous.y - canvas.offsetTop,
                    width: e.pageX - previous.x,
                    height: e.pageY - previous.y
                });
            }
            drawMap();
        } else {
            previous.x = e.pageX;
            previous.y = e.pageY;
            secondClick = true;
            drawMap();
        }
    }

    // Draws the map, with hit boxes on top
    function drawMap() {
        _r.drawMap();
        var canvas = document.getElementById("board");
        var ctx = canvas.getContext("2d");
        _g.board.territories.forEach(function(t) {
            ctx.rect(t.x, t.y, t.width, t.height);
        });
        ctx.stroke();
    }

    function showTerritoryList() {
        var windowContents = $(nj.render( "static/templates/tList.html", {territories: _g.board.territories}));

        windowContents.find("li").click(function() {
            var name = $(this).data("name");
            var cache = undefined;
            _g.board.territories.forEach(function(t) {
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
});