define(["backbone", "knockout", "underscore", "text!views/buy/buyUnits.html", "helpers", "gameAccessor", "router"],
    function(backbone, ko, _, template, _h, _b, _router) {

    var BuyUnitView = backbone.View.extend({
        initialize: function() {
            this.viewModel = this.initViewModel();
            return this;
        },
        initViewModel: function(){
            var view = this;
            var MoveUnitVM = function() {
                var board = _b.getBoard(),
                    terrainPriority = ["land", "air", "sea"];
                this.totalCost = ko.observable(view.moneySpent());
                this.currentMoney = board.currentCountry.ipc;
                this.unitInfoList = _.chain(board.info.unitCatalogue)
                    .map(function(info, unitType) {
                        return {
                            unitType: unitType,
                            imageSrc: _h.getImageSource(unitType, board.currentCountry),
                            unitInfo: info
                        }
                    })
                    .sort(function(a, b) {
                        var priorityA = terrainPriority.indexOf(a.unitInfo.terrainType);
                        var priorityB = terrainPriority.indexOf(b.unitInfo.terrainType);
                        return (priorityA - priorityB) ||
                            (a.unitInfo.cost - b.unitInfo.cost) ||
                            (a.unitType < b.unitType ? -1 : 1);
                    })
                    .value();

                this.amount = function (unitType) {
                    return _.filter(_b.getBoard().buyList(), function(unit) {
                        return unit.unitType === unitType;
                    }).length
                };

                this.increment = function() {

                };
                this.decrement = function() {

                };
            };

            return new MoveUnitVM();
        },

        buyUnits: function (unitType, targetAmount) {
            var newArray = [];
            _b.getBoard().buyList().forEach(function(boughtUnit) {
                var boughtUnitType = boughtUnit.unitType;
                if (boughtUnitType === unitType) {
                    if (targetAmount > 0) {
                        targetAmount -= 1;
                        newArray.push(boughtUnit); // copy to new array
                    } else {
                        // don't push, we've met the target
                    }
                } else {
                    newArray.push(boughtUnit); // copy all other units in the array
                }
            });
            // push to meet target
            for(var i=0; i<targetAmount; i++) {
                newArray.push({
                    unitType: unitType,
                    territory: ""
                });
            }
            _b.getBoard().buyList(newArray); // set buy list
            _router.setBuyList(newArray);
        },

        capForUnitType: function (unitType) {
            var board = _b.getBoard();
            var info = board.unitInfo(unitType);
            var remainingMoney = board.currentCountry.ipc - this.moneySpent();
            var currentAmount = _b.getBoard().buyList().reduce(function (number, boughtUnit) {
                if (boughtUnit.unitType == unitType) {
                    return number + 1;
                } else {
                    return number;
                }
            }, 0);
            var newMax = Math.floor(remainingMoney / info.cost) + currentAmount;
            if (newMax < 0) {
                console.error("Spent more than allowed")
            }
            return newMax;
        },

        moneySpent: function() {
            return _b.getBoard().buyList().reduce(function (total, boughtUnit) {
                var data = _b.getBoard().unitInfo(boughtUnit.unitType);
                return total + data.cost;
            }, 0);
        },

        render: function() {
            var that = this;
            this.$el.dialog({
                title: "Unit List",
                modal: false,
                closeOnEscape: false,
                width: Math.min(600, window.innerWidth), // never larger than screen, or 600px
                height: Math.min(500, window.innerHeight),
                buttons: {
                    "Ok": function () {
                        _b.getBoard().nextPhase();
                    }
                }
            });
            ko.applyBindings(this.viewModel, this.$el.append(template)[0]);
            this.$(".buyAmount").each(function (index, input) {
                input = $(input);
                var unitType = input.data("type");
                input.val(_.filter(_b.getBoard().buyList(), function(boughtUnit){
                    return boughtUnit.unitType === unitType
                }).length);
                input.counter({
                    min: 0,
                    max: function(){ return that.capForUnitType(unitType)},
                    change: function () {
                        that.buyUnits(unitType, input.counter("value"));
                        that.viewModel.totalCost(that.moneySpent());
                    }
                });
            });
        },

        remove: function() {
            backbone.View.prototype.remove.apply(this, arguments);
            if (this.$el.data("dialog"))
                this.$el.dialog("destroy");
        }
    });
    return BuyUnitView;
});