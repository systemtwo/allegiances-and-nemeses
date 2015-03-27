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

// TODO dschwarz clean this file when we implement a user module system. Until then it's rarely used
// Start the main app logic.
requirejs(["nunjucks", "gameAccessor", "render", "board", "helpers"], function(nj, _g, _r, board, _h) {
    // Local namespace
    var territoryCatalogue = [];
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
        var moduleSelect = $("#moduleSelect");
        $.ajax("/modules", {
            success: function(response) {
               JSON.parse(response).map(function(m) {
                   moduleSelect.append($("<option>" + m + "</option>"))
               });
            }
        });

        $("#moduleLoad").click(function() {
            var moduleName = moduleSelect.val();
            if (moduleName) {
                initBoard(moduleName);
            }
        });
        $("#createModule").click(function() {
            $.ajax("/modules/create", {data: {
                moduleName: prompt("Module Name")
            }}).always(function() {
//                window.location.reload();
            })
        });
        _r.showSkeleton(true);

        $("#createButton").click(function(){
            _r.setSelectableTerritories([]);
            currentMode = modes.CREATE;
            setCurrentTerritory(null);
            secondClick = false;
        });
        $("#connectButton").click(function(){
            _r.setSelectableTerritories(territoryCatalogue);
            currentMode = modes.CONNECT;
            setCurrentTerritory(null);
            connectionStart = null;
            secondClick = false;
        });
        $("#browseButton").click(function(){
            _r.setSelectableTerritories(territoryCatalogue);
            currentMode = modes.BROWSE;
            setCurrentTerritory(null);
            secondClick = false;
        });
        $("#territoryButton").click(function(){
            showTerritoryList();
            secondClick = false;
        });
        $("#printConnections").click(function(){
            var textarea = $("<textarea>").val(getJSON().connections);
            textarea.dialog({
                title: "Copy JSON",
                open: function(){ textarea.select(); },
                buttons: {
                    "Close": function () {
                        $(this).dialog("close");
                    }
                }
            });
        });
        $("#printTerritories").click(function(){
            var textarea = $("<textarea>").val(getJSON().territories);
            textarea.dialog({
                title: "Copy JSON",
                open: function(){ textarea.select(); },
                buttons: {
                    "Close": function () {
                        $(this).dialog("close");
                    }
                }
            });
        });
        $("#getJSONButton").click(function(){
            console.log(getJSON());
        });
    }

    function initBoard(moduleName) {
        _g.board = new board.Board();

        $.getJSON("/modules/" + moduleName).done(function(moduleInfo) {
            // NOTE - territories and countries are stored as plain objects for the map editor,
            // and do NOT use the Territory and Country class
            _g.board.wrapsHorizontally = moduleInfo.wrapsHorizontally;
            _g.board.territories = territoryCatalogue = JSON.parse(moduleInfo.territories);
            _g.board.countries = JSON.parse(moduleInfo.countries);

            _r.setSelectableTerritories(territoryCatalogue);
            _g.connections = JSON.parse(moduleInfo.connections).map(function(c) {
                var first = null,
                    second = null;
                territoryCatalogue.forEach(function(t) {
                    if (t.name == c[0]){
                        first = t;
                    } else if (t.name == c[1]) {
                        second = t;
                    }
                });
                return [first, second];
            });

            _g.board.setImage(moduleInfo.imagePath, function() {
                _r.initMap();
                $("#board").mousedown(mapClick);
            });
        });
    }

    var secondClick = false, firstClick = {}, connectionStart = null;
    // Override the click handler on the canvas element with this function, when in map editor mode
    function mapClick(e) {
        if (e.button == "2") {
            return; // DO NOTHING
        }
        var canvas = document.getElementById("board");
        var t = _r.territoryAtPoint(e.pageX - canvas.offsetLeft + _r.offset.x, e.pageY - canvas.offsetTop + _r.offset.y);

        if (currentMode == modes.BROWSE) {
            if (t) {
                setCurrentTerritory(t);
            }
        } else if (currentMode == modes.CONNECT) {
            if (t) {
                if (connectionStart && connectionStart!==t) {
                    _g.connections.push([connectionStart, t]);
                    connectionStart = null;
                    _r.hideArrow();
                } else {
                    _r.showArrowFrom(t);
                    connectionStart = t;
                }
            } else {
                connectionStart = null;
                _r.hideArrow();
            }
        } else if ((currentMode === modes.HITBOX) && t && _r.territoryIsSelectable(t)) {
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
                _r.setSelectableTerritories(territoryCatalogue);
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
        _r.drawMap();
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
        var singleBoardWidth = _g.board.getMapWidth();
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

    function showTerritoryList() {
        var windowContents = $(nj.render( "static/templates/tList.html", {territories: territoryCatalogue}));

        windowContents.find(".territoryRow").click(function() {
            var name = $(this).data("name");
            var matchingTerritory = undefined;
            territoryCatalogue.forEach(function(t) {
                if (t.name == name) {
                    matchingTerritory = t;
                }
            });
            selectTerritory(matchingTerritory);
            _r.setSelectableTerritories(territoryCatalogue);
            windowContents.dialog("close");
        }).css("cursor", "pointer");

        windowContents.dialog({
            title: "Territories - Click to Edit",
            modal: false,
            width: 600,
            dialogClass: "no-close-button",
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
        currentMode = modes.BROWSE;
        _r.setSelectableTerritories([]);
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
                var type = "land";
                array.forEach(function(attribute) {
                    if (attribute.name == "type") {
                        type = attribute.value;
                        return;
                    }
                    t[attribute.name] = attribute.value;
                });

                // 'type' checkbox does not appear in array if deselected, so must be land if 'type' not present
                var changed = t.type !== type;
                t.type = type;
                if (changed) {
                    setCurrentTerritory(t); // force rerender
                }
            };
            contents.find("input").change(onChange);
            contents.find("select").change(onChange);
            $("#hitbox").click(function(){
                _r.setSelectableTerritories([]);
                currentMode = modes.HITBOX;
            });
        }
    }

    function getJSON() {
        return {
            territories: JSON.stringify(territoryCatalogue.map(function(t) {
                if (t.type == "sea") {
                    var copiedTerritory = jQuery.extend({}, t);
                    // sea zones don't produce and can't be owned
                    delete copiedTerritory.country;
                    delete copiedTerritory.income;
                    return copiedTerritory;
                } else {
                    return t;
                }
            })),
            connections: JSON.stringify(_g.connections.map(function (c) {return [c[0].name, c[1].name]}))
        };
    }

    window.getJSON = getJSON;

    initialize();
});