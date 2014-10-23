requirejs.config({
    baseUrl: 'static/scripts',
    paths: {
        "nunjucks": "lib/nunjucks"
    },
    shim: {
        "jQuery-ui": {
            exports: "$",
            deps: "jQuery"
        }
    }
});

// Start the main app logic.
requirejs(["nunjucks", "globals", "render", "board", "helpers"], function(nj, _g, _r, board, _h) {
    // Local namespace
    var territoryCatalogue = [];
    var connections = [];
    window.connections = connections; // TODO remove after testing
    var currentTerritory;
    setCurrentTerritory(null);
    var modes = {
        CREATE: "createTerritory",
        HITBOX: "editTerritory",
        CONNECT: "connect",
        BROWSE: "doNothing"
    };
    var currentMode = modes.BROWSE;

    window.getMode = function() {
        return currentMode;
    };

    function initialize() {
        var map = new Image();
        map.src = "/static/css/images/defaultMap2.jpg";
        map.onload = function() {
            initBoard(map);

            $("#createButton").click(function(){
                _h.setSelectableTerritories([]);
                currentMode = modes.CREATE;
                setCurrentTerritory(null);
            });
            $("#connectButton").click(function(){
                _h.setSelectableTerritories(territoryCatalogue);
                currentMode = modes.CONNECT;
                setCurrentTerritory(null);
            });
            $("#browseButton").click(function(){
                _h.setSelectableTerritories(territoryCatalogue);
                currentMode = modes.BROWSE;
            });
            $("#territoryButton").click(function(){
                showTerritoryList();
            });
        };
    }

    function initBoard(image) {
        _g.board = new board.Board(image);
        var tPromise = $.getJSON("/shared/TerritoryList.json");
        var cPromise = $.getJSON("/shared/CountryList.json");
        var connectionPromise = $.getJSON("/shared/connections.json");

        $.when(tPromise, cPromise, connectionPromise).done(function(territoryResponse, countryResponse, connectionResponse) {
            _g.board.territories = territoryCatalogue = territoryResponse[0];
            _g.board.countries = countryResponse[0];

            _h.setSelectableTerritories(territoryCatalogue);
            connections = connectionResponse[0].map(function(c) {
                var first, second = null;
                territoryCatalogue.forEach(function(t) {
                    if (t.name == c[0]){
                        first = t;
                    } else if (t.name == c[1]) {
                        second = t;
                    }
                });
                return [first, second];
            });
            _r.initMap(drawMap);
            $("#board").mousedown(mapClick);
        });
    }

    var secondClick = false, firstClick = {};
    // Override the click handler on the canvas element with this function, when in map editor mode
    function mapClick(e) {
        if (e.shiftKey) {
            return; // DO NOTHING
        }
        var canvas = document.getElementById("board");
        var t = _h.territoryAtPoint(e.pageX - canvas.offsetLeft + _r.offset.x, e.pageY - canvas.offsetTop + _r.offset.y);

        if (currentMode == modes.BROWSE) {
            if (t) {
                setCurrentTerritory(t);
            }
        } else if (currentMode == modes.CONNECT) {
            if (t) {
                if (currentTerritory && currentTerritory!==t) {
                    connections.push([currentTerritory, t]);
                    setCurrentTerritory(null);
                    _r.hideArrow();
                } else {
                    _r.showArrowFrom(t);
                    setCurrentTerritory(t);
                }
            } else {
                setCurrentTerritory(null);
                _r.hideArrow();
            }
        } else if ((currentMode === modes.HITBOX) && t && _h.territoryIsSelectable(t)) {
            selectTerritory(t);
        } else if (currentMode === modes.HITBOX && currentTerritory) {
            if (secondClick) {
                secondClick = false;
                var rect = createRect(firstClick, {x: e.pageX, y: e.pageY});
                currentTerritory.x = rect.x;
                currentTerritory.y = rect.y;
                currentTerritory.width = rect.width;
                currentTerritory.height = rect.height;
                // rerender side bar with new hitbox
                setCurrentTerritory(currentTerritory);
                currentMode = modes.BROWSE;
                _h.setSelectableTerritories(territoryCatalogue);
            } else {
                firstClick.x = e.pageX;
                firstClick.y = e.pageY;
                secondClick = true;
            }
        } else if (currentMode === modes.CREATE) {
            if (secondClick) {
                secondClick = false;
                var newTerritory = createRect(firstClick, {x: e.pageX, y: e.pageY});

                setCurrentTerritory(newTerritory);
                territoryCatalogue.push(newTerritory);
            } else {
                firstClick.x = e.pageX;
                firstClick.y = e.pageY;
                secondClick = true;
            }
        }
        drawMap();
    }

    // Creates a rectangle based on pageX and pageY
    function createRect(begin, end) {
        var canvas = document.getElementById("board");
        // Make sure it goes top left to bottom right
        if (begin.x > end.x) {
            console.log("switching x");
            var tempX = begin.x;
            begin.x = end.x;
            end.x = tempX;
        }
        if (begin.y > end.y) {
            console.log("switching y");
            var tempY = begin.y;
            begin.y = end.y;
            end.y = tempY;
        }
        var singleBoardWidth = _g.board.mapImage.width/2;
        if (begin.x > singleBoardWidth) {
            begin.x -= singleBoardWidth;
            end.x -= singleBoardWidth;
        }

        var rect = {
            x: begin.x - canvas.offsetLeft + _r.offset.x, // convert to board coords
            y: begin.y - canvas.offsetTop + _r.offset.y,
            width: end.x - begin.x,
            height: end.y - begin.y
        };
        if (rect.x > singleBoardWidth) {
            rect.x -= singleBoardWidth;
        }
        return rect;
    }

    // Draws the map, with hit boxes on top
    function drawMap() {
        var canvas = document.getElementById("board");
        var ctx = canvas.getContext("2d");
        _r.drawMap();
        territoryCatalogue.forEach(function(t) {
            _r.drawRect(t.x, t.y, t.width, t.height);
        });
        ctx.stroke();

        connections.forEach(function (c) {
            _r.drawLine(c[0], c[1])
        });
    }

    function showTerritoryList() {
        var windowContents = $(nj.render( "static/templates/tList.html", {territories: territoryCatalogue}));

        windowContents.find("li").click(function() {
            var name = $(this).data("name");
            var cache = undefined;
            territoryCatalogue.forEach(function(t) {
                if (t.name == name) {
                    cache = t;
                }
            });
            selectTerritory(cache);
            windowContents.dialog("close");
        });

        windowContents.dialog({
            title: "Territories - Click to Edit",
            modal: false,
            width: 600,
            height: Math.min(500, window.innerHeight),
            buttons: {
                "Close": function () {
                    $(this).dialog("close");
                }
            }
        })
    }

    function selectTerritory (t){
        setCurrentTerritory(t);
        currentMode = modes.HITBOX;
        _h.setSelectableTerritories([]);
    }

    function setCurrentTerritory(t) {
        currentTerritory = t;
        if (t === null) {
            $("#editTerritoryPanel").empty().hide();
        } else {
            var hasHitbox = t.x && t.y && t.width && t.height;
            var contents = $(nj.render("static/templates/editTerritory.html", {territory: t, countries: _g.board.countries, hasHitbox: hasHitbox}));
            $("#editTerritoryPanel").show().html(contents);
            var onChange = function(){
                // Save the territory
                var array = $("#editTerritoryForm").serializeArray();
                array.forEach(function(attribute) {
                    t[attribute.name] = attribute.value;
                });
            };
            contents.find("input").change(onChange);
            contents.find("select").change(onChange);
            $("#hitbox").click(function(){
                _h.setSelectableTerritories([]);
                currentMode = modes.HITBOX;
            });
        }
    }

    function getJSON() {
        return {
            territories: JSON.stringify(territoryCatalogue),
            connections: JSON.stringify(connections.map(function (c) {return [c[0].name, c[1].name]}))
        };
    }

    window.getJSON = getJSON;

    initialize();
});