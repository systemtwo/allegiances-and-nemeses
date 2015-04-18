requirejs.config({
    baseUrl: '/static/scripts',
    paths: {
        "nunjucks": "lib/nunjucks",
        "backbone": "lib/backbone",
        "knockout": "lib/knockout-3.3.0.debug",
        "underscore": "lib/underscore",
        "jquery": "lib/jquery-1.11.1",
        "jquery-ui": "lib/jquery-ui-1.11.3/jquery-ui"
    }
});
// Start the main app logic.
requirejs(["nunjucks", "svgMap", "underscore", "jquery-ui"], function(nj, _svg, _) {
    // Local namespace
    var currentTerritory;
    var boardInfo = {};

    var testInfo = {
        territories: [
            {
                name: "uniqueName",
                displayName: "Display Name",
                income: 5,
                displayInfo: {
                    path: "M0,0 L100,0 L100,100 L0,100 z",
                    name: {
                        x: 50,
                        y: 50
                    },
                    circle: {
                        x: 80,
                        y: 20
                    }
                }
            }
        ]
    };
    setCurrentTerritory(null);
    var modes = {
        CREATE: "createTerritory",
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
                initModule(moduleName);
            }
        });
        $("#createModule").click(function() {
            $.ajax("/modules/create", {data: {
                moduleName: prompt("Module Name")
            }}).always(function() {
//                window.location.reload();
            })
        });

        $("#createButton").click(function(){
            //_r.setSelectableTerritories([]);
            currentMode = modes.CREATE;
            setCurrentTerritory(null);
            secondClick = false;
        });
        $("#connectButton").click(function(){
            //_r.setSelectableTerritories(territoryCatalogue);
            currentMode = modes.CONNECT;
            setCurrentTerritory(null);
            connectionStart = null;
            secondClick = false;
        });
        $("#browseButton").click(function(){
            //_r.setSelectableTerritories(territoryCatalogue);
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

    function initModule(moduleName) {
        $.getJSON("/modules/" + moduleName).done(function(moduleInfo) {
            // NOTE - territories and countries are stored as plain objects for the map editor,
            // and do NOT use the Territory and Country class
            boardInfo.wrapsHorizontally = moduleInfo.wrapsHorizontally;
            boardInfo.territories = JSON.parse(moduleInfo.territories);

            boardInfo.territories = testInfo.territories;

            boardInfo.countries = JSON.parse(moduleInfo.countries);

            boardInfo.connections = JSON.parse(moduleInfo.connections).map(function(c) {
                var first = _.find(boardInfo.territories, {name: c[0]});
                var second = _.find(boardInfo.territories, {name: c[1]});
                return [first, second];
            });

            var thing = new _svg.Map(testInfo, document.body);
            thing.drawMap();
            thing.on("click:territory", function(territoryName) {
                var territory = _.findWhere(boardInfo.territories, {name: territoryName});
                selectTerritory(territory);
            });
            thing.on("click:nothing", function() {
                selectTerritory(null);
            });
            //_r.setSelectableTerritories(territoryCatalogue);
        });
    }

    var secondClick = false, firstClick = {}, connectionStart = null;
    // Override the click handler on the canvas element with this function, when in map editor mode
    function territoryClick(t) {
        if (currentMode == modes.BROWSE) {
            if (t) {
                setCurrentTerritory(t);
            }
        } else if (currentMode == modes.CONNECT) {
            if (t) {
                if (connectionStart && connectionStart!==t) {
                    boardInfo.connections.push([connectionStart, t]);
                    connectionStart = null;
                    //_r.hideArrow();
                } else {
                    //_r.showArrowFrom(t);
                    connectionStart = t;
                }
            } else {
                connectionStart = null;
                //_r.hideArrow();
            }
        }
        //_r.drawMap();
    }
    function showTerritoryList() {
        var windowContents = $(nj.render( "/static/templates/tList.html", {territories: boardInfo.territories}));

        windowContents.find(".territoryRow").click(function() {
            var name = $(this).data("name");
            var matchingTerritory = _.findWhere(boardInfo.territories, {name: name});
            selectTerritory(matchingTerritory);
            //_r.setSelectableTerritories(territoryCatalogue);
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
        //_r.setSelectableTerritories([]);
    }

    function setCurrentTerritory(t) {
        currentTerritory = t;
        if (t === null) {
            $("#editTerritoryPanel").empty().hide();
        } else {
            var contents = $(nj.render("static/templates/editTerritory.html", {territory: t, countries: boardInfo.countries}));
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
        }
    }

    function getJSON() {
        return {
            territories: JSON.stringify(boardInfo.territories.map(function(t) {
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
            connections: JSON.stringify(boardInfo.connections.map(function (c) {return [c[0].name, c[1].name]}))
        };
    }

    window.getJSON = getJSON;

    initialize();
});