// TODO use this to replace board components
define(["backbone", "underscore", "components"], function(backbone, underscore, _c) {
    var Territories = backbone.Collection.extend({
    });

    var Units = backbone.Collection.extend({
    });

    var Conflicts = backbone.Collection.extend({

    });

    var Countries = backbone.Collection.extend({

    });

    var BuyList = backbone.Collection.extend({

    });

    return {
        Territories: Territories,
        Units: Units,
        Conflicts: Conflicts,
        Countries: Countries,
        BuyList: BuyList
    }
});