define(["backbone", "underscore", "knockout", "text!views/sidePanel/countries.ko.html", "gameAccessor"],
    function(backbone, _, ko, template, _b) {
    return backbone.View.extend({
        initialize: function () {
            var that = this;
            var board = _b.getBoard();
            function countryViewModel (c) {
                var territories = board.territoriesForCountry(c);
                var income = _.reduce(territories, function (memo, t) {
                    return memo + (_.isFinite(t.income) ? t.income : 0);
                }, 0);
                return {
                    displayName: c.displayName,
                    money: c.money,
                    income: '+'+income,
                    color: c.color,
                    playerName: "Jo"
                }
            }
            this.viewModel = {
                countries: ko.observableArray(_.map(board.getCountries(), countryViewModel))
            };
            board.on("change", function () {
                that.viewModel.countries([]);
                that.viewModel.countries( _.map(board.getCountries(), countryViewModel));
            });
            return this;
        },

        render: function () {
            this.$el.empty();
            ko.applyBindings(this.viewModel, $(template).appendTo(this.$el)[0]);
        }
    });
});