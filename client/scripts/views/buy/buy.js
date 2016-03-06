define(["backbone", "knockout", "underscore", "text!views/buy/buy.ko.html", "helpers", "gameAccessor", "router"],
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
                    terrainPriority = ["land", "air", "sea"],
                    vm = this;
                this.totalCost = ko.observable(view.moneySpent());
                board.on("change", function() {
                    vm.totalCost(view.moneySpent());
                });
                this.isMyTurn = board.isCurrentPlayersTurn();
                this.currentMoney = board.currentCountry.money;
                this.unitInfoList = _.chain(board.info.unitCatalogue)
                    .map(function(info, unitType) {
                        var amount = ko.observable(view.amount(unitType));
                        function onAmountChange(value) {
                            view.buyUnits(unitType, value);
                        }
                        var subscription = amount.subscribe(onAmountChange);

                        board.on("change", function () {
                            subscription.dispose();
                            amount(view.amount(unitType));
                            subscription = amount.subscribe(onAmountChange);
                        });
                        return {
                            unitType: unitType,
                            imageSrc: _h.getImageSource(info, board.currentCountry),
                            unitInfo: info,
                            amount: amount,
                            increment: function(data, event) {
                                var nextValue = amount() + 1;
                                var cap = view.capForUnitType(unitType);
                                amount(Math.min(nextValue, cap));
                            },
                            decrement: function(data, event) {
                                amount(Math.max(amount() - 1, 0));
                            }
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
            };

            return new MoveUnitVM();
        },

        amount: function (unitType) {
            return _.filter(_b.getBoard().buyList(), function(unit) {
                return unit.unitType === unitType;
            }).length
        },

        buyUnits: function (unitType, targetAmount) {
            var newArray = [];
            var board = _b.getBoard();
            var originalBuyList = board.buyList();
            var target = Math.min(this.capForUnitType(unitType), targetAmount);
            originalBuyList.forEach(function(boughtUnit) {
                var boughtUnitType = boughtUnit.unitType;
                if (boughtUnitType === unitType) {
                    if (target > 0) {
                        target -= 1;
                        newArray.push(boughtUnit); // copy to new array
                    } else {
                        // don't push, we've met the target
                    }
                } else {
                    newArray.push(boughtUnit); // copy all other units in the array
                }
            });
            // push to meet target
            for(var i=0; i < target; i++) {
                newArray.push({
                    unitType: unitType,
                    territory: ""
                });
            }
            board.buyList(newArray); // set buy list
            _router.setBuyList(newArray).fail(function() {
                board.buyList(originalBuyList); // replace caching with a call to fetch the server's buy list
            });
        },

        capForUnitType: function (unitType) {
            var board = _b.getBoard();
            var info = board.unitInfo(unitType);
            var remainingMoney = board.currentCountry.money - this.moneySpent();
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
            var initialHeight = Math.min(500, window.innerHeight);
            ko.applyBindings(this.viewModel, this.$el.append(template)[0]);
            this.$el.dialog({
                title: "Unit List",
                closeOnEscape: false,
                width: Math.min(600, window.innerWidth), // never larger than screen, or 600px
                height: initialHeight
            });
        }
    });
    return BuyUnitView;
});
