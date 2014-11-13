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
requirejs(["globals", 'board', "phases", "components", "render", "router"],
function (_g, board, _p, _c, _r, _router) {
    _router.fetchBoards(function(boards) {
        _r.showBoardList(boards, onBoardSelect);
    });

    function onBoardSelect(boardId, onSucess) {
        _router.fetchBoard(boardId, function(boardInfo) {
            _g.board = new board.Board(boardInfo.id);
            _g.board.wrapsHorizontally = boardInfo.wrapsHorizontally;
            console.time("Map Load");
            _g.board.setImage(boardInfo.imagePath, function onMapLoad() {
                console.timeEnd("Map Load");
                _r.initMap();
            });
            _g.unitCatalogue = boardInfo.unitCatalogue;

            _g.board.countries = boardInfo.countries.map(function(c) {
                var countryInfo = JSON.parse(c);
                return new _c.Country(countryInfo.name, countryInfo.team, countryInfo.ipc)
            });

            console.table(_g.board.countries);
            boardInfo.territoryInfo.forEach(function(tInfo) {
                var country = null;
                for (var i=0; i<_g.board.countries.length; i++) {
                    if (_g.board.countries[i].name == tInfo.country) {
                        country = _g.board.countries[i];
                        break;
                    }
                }
                _g.board.territories.push(new _c.Territory(tInfo.name, tInfo.income, country, tInfo.x, tInfo.y, tInfo.width, tInfo.height))
            });

            _g.currentCountry = _g.board.countries[0];

            // ADD TEST UNITS
            _g.board.addUnit("fighter", "Russia", "ussr");
            _g.board.addUnit("infantry", "Russia", "ussr");
            _g.board.addUnit("tank", "Russia", "ussr");
            _g.board.addUnit("tank", "Archangel", "ussr");
            _g.board.addUnit("bomber", "Evenki", "ussr");
            _g.board.addUnit("infantry", "Yakut", "ussr");

            // current phase is the class name of the phase
            var phaseClass = _p[boardInfo.currentPhase];
            _g.currentPhase = new phaseClass();

            boardInfo.connections.map(function(c) {
                var first = null,
                    second = null;
                _g.board.territories.forEach(function(t) {
                    if (t.name == c[0]){
                        first = t;
                    } else if (t.name == c[1]) {
                        second = t;
                    }
                });
                first.connections.push(second);
                second.connections.push(first);
            });
            onSucess(); // closes the dialog
        });
    }
});