define(["backbone", "underscore", "knockout", "text!../templates/editTerritory.ko.html"],
function(backbone, _, ko, template) {
    var boundTerritoryValues = ["displayName", "income", "country"];

    var TerritoryPaneView = backbone.View.extend({
        options: {
            /**
             * Object containing all the info about a territory
             */
            territory: null,
            /**
             * Array of objects containing name and displayName
             */
            countryList: []
        },
        initialize: function() {
            this.viewModel = this.initViewModel();
            return this;
        },
        initViewModel: function(){
            var view = this;

            var ViewModel = function() {
                var vm = this;
                var nullTerritory = _.isNull(view.options.territory);
                function bindValue(key) {
                    vm[key] = ko.observable();
                    if (!nullTerritory) {
                        vm[key](view.options.territory[key]);
                    }
                    vm[key].subscribe(function(newValue) {
                        view.options.territory[key] = newValue;
                    });
                }
                boundTerritoryValues.forEach(bindValue);
                vm.isVisible = ko.observable(!nullTerritory);
                vm.countryList = ko.observable(view.options.countryList);

                vm.isLandTerritory = ko.observable();
                if (!nullTerritory) {
                    vm.isLandTerritory(view.options.territory.type == "land");
                }
                vm.isLandTerritory.subscribe(function (isLandTerritory) {
                    if (view.options.territory) {
                        view.options.territory.type = isLandTerritory ? "land" : "sea";
                    }
                });

                return vm;
            };

            return new ViewModel();
        },

        update: function(newOptions) {
            var view = this;
            _.extend(this.options, newOptions);

            if (newOptions.territory) {
                boundTerritoryValues.forEach(function(key) {
                    view.viewModel[key](newOptions.territory[key])
                });
                view.viewModel.isLandTerritory(newOptions.territory.type == "land");
            }
            if (newOptions.countryList) {
                view.viewModel.countryList(newOptions.countryList);
            }

            view.viewModel.isVisible(!_.isNull(view.options.territory));
        },

        render: function() {
            this.$el.empty();
            ko.applyBindings(this.viewModel, $(template).appendTo(this.$el)[0]);
        }
    });
    return TerritoryPaneView;
});