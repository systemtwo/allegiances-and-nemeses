define(["backbone", "knockout", "underscore", "text!views/buy/buyUnits.html", "helpers", "gameAccessor", "router"],
    function(backbone, ko, _, template, _h, _b, _router) {
    var BuyUnitView = backbone.View.extend({
        buyList: [],

        initialize: function() {
            this.viewModel = this.initViewModel();
            return this;
        },
        initViewModel: function(){
            var view = this;
            var MoveUnitVM = function() {
                var board = _b.getBoard();
                this.totalCost = ko.observable(view.moneySpent());
                this.currentMoney = board.currentCountry.ipc;
                this.unitTypes = Object.keys(board.info.unitCatalogue);
                this.unitInfo = function(unitType) {
                    return board.unitInfo(unitType) || {};
                }
            };

            return new MoveUnitVM();
        },

        buyUnits: function (unitType, targetAmount) {
            var newArray = [];
            this.buyList.forEach(function(boughtUnitType) {
                if (boughtUnitType === unitType) {
                    if (targetAmount > 0) {
                        targetAmount -= 1;
                        newArray.push(boughtUnitType);
                    } else {
                        // don't push, we've met the target
                    }
                } else {
                    newArray.push(boughtUnitType);
                }
            });
            // push to meet target
            for(var i=0; i<targetAmount; i++) {
                newArray.push(unitType);
            }
            this.buyList = newArray;
        },

        capForUnitType: function (unitType) {
            var board = _b.getBoard();
            var info = board.unitInfo(unitType);
            var remainingMoney = board.currentCountry.ipc - this.moneySpent();
            var currentAmount = this.buyList.reduce(function (number, boughtUnitType) {
                if (boughtUnitType == unitType) {
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
            return this.buyList.reduce(function (total, unitType) {
                var data = _b.getBoard().unitInfo(unitType);
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
                        _router.buyUnits(that.buyList).done(function () {
                            _b.getBoard().nextPhase();
                            that.$el.dialog("destroy");
                        });
                    }
                }
            });
            ko.applyBindings(this.viewModel, this.$el.append(template)[0]);
            this.$(".buyAmount").each(function (index, input) {
                input = $(input);
                var unitType = input.data("type");
                input.counter({
                    min: 0,
                    max: function(){ return that.capForUnitType(unitType)},
                    change: function () {
                        that.buyUnits(unitType, input.counter("value"));
                        that.viewModel.totalCost(that.moneySpent());
                    }
                });
            });
        }
    });
    return BuyUnitView;
});