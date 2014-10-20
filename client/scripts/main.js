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
requirejs(["globals", 'board', "phases", "components", "render"],
function (_g, board, _p, _c, _r) {

    function initBoard(image) {
        _g.board = new board.Board(image);
        _r.initMap();

        var unitPromise = $.getJSON("/shared/UnitList.json");
        var tPromise = $.getJSON("/shared/TerritoryList.json");
        var cPromise = $.getJSON("/shared/CountryList.json");

        $.when(unitPromise, tPromise, cPromise).done(function(unitResponse, territoryResponse, countryResponse) {
            _g.unitCatalogue = unitResponse[0];

            _g.board.countries = countryResponse[0].map(function(c) {
                return new _c.Country(c.name, c.team)
            });
            territoryResponse[0].forEach(function(t) {
                var country = null;
                for (var i=0; i<_g.board.countries.length; i++) {
                    if (_g.board.countries[i].name == t.country) {
                        country = _g.board.countries[i];
                        break;
                    }
                }
                _g.board.territories.push(new _c.Territory(t.name, t.income, country, t.x, t.y, t.width, t.height))
            });

            _g.currentCountry = _g.board.countries[0];
            _g.currentCountry.ipc = 100;
            _g.currentPhase = new _p.BuyPhase();

        });
    }

    var map = new Image();
    map.src = "/static/css/images/defaultMap2.jpg";
    map.onload = function() {
        initBoard(map);
    };

});