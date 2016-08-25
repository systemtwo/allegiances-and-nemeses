define(['underscore', 'knockout', "text!../templates/lobbyInfo.ko.html"], function (_, ko, template) {
    var gameId = null;
    var viewModel = null;
    var userId = null;
    // takes in constants from the server. The params here should never change
    function initialize(gameIdParam, userIdParam) {
        gameId = gameIdParam;
        userId = userIdParam;

        fetchLobbyInfo().done(function (response) {
            console.log(response);
            viewModel = initViewModel([{name: "napoleon"}], response);

            ko.applyBindings(viewModel, $("#lobby-info-container").append(template)[0]);
        });
    }

    function initViewModel(modules, initialLobbyInfo) {
        function LobbyInfoViewModel() {
            var vm = this;
            vm.modules = modules;
            // array of player id and name
            vm._players = ko.observableArray(initialLobbyInfo.players);
            vm._countries = ko.observableArray();
            vm._countryAssignmentsNotifier = ko.observable();

            vm.canEdit = ko.computed(function () {
                return initialLobbyInfo.creatorId == userId;
            });
            vm.roomName = ko.observable(initialLobbyInfo.name);
            vm.selectedModule = ko.observable(initialLobbyInfo.module);
            vm.selectedMaxPlayersOption = ko.observable(initialLobbyInfo.maxPlayers);
            vm.maxPlayersOptions = function () {
                // var selectedModule = vm.selectedModule();
                var selectedModule = {
                    countries: {
                        length: 3
                    }
                };
                var maxPlayerOptions = [];

                if (selectedModule) {
                    for (var i = 1; i <= selectedModule.countries.length; i++) {
                        maxPlayerOptions.push(i);
                    }
                }

                return maxPlayerOptions;
            };

            vm.unassignedCountries = function () {
                vm._countryAssignmentsNotifier(); // depend on this
                return vm._countries().filter(function (country) {
                    return _.every(vm._players(), function (player) {
                        return !_.contains(player.assignedCountries, country.name);
                    })
                })
            };

            vm.players = function () {
                vm._countryAssignmentsNotifier(); // depend on this
                return vm._players().map(function(player) {
                    return {
                        name: player.name,
                        id: player.id,
                        assignedCountries: player.assignedCountries.map(function (countryName) {
                            return vm._countries().find(function (country) { return country.name == countryName });
                        })
                    }
                });
            };

            // actions
            vm.beginGame = function () {
                console.log("Begin game not implemented")
            };

            vm.save = function () {
                saveLobbyInfo(toSaveFormat());
            };

            // helpers
            var toSaveFormat = function () {
                var countryPlayers = [];
                _.each(vm._players(), function (player) {
                   _.each(player.assignedCountries, function (countryName) {
                       countryPlayers.push({
                           country: countryName,
                           userId: player.id
                       })
                   })
                });
                return JSON.stringify({
                    maxPlayers: vm.selectedMaxPlayersOption(),
                    gameName: vm.roomName(),
                    countryPlayer: countryPlayers,
                    moduleName: vm.selectedModule().name
                })
            };

            return vm;
        }

        return new LobbyInfoViewModel();
    }

    function fetchLobbyInfo() {
        return $.get("/lobby/" + gameId + "/info");
    }

    function saveLobbyInfo(lobbyInfo) {
        return $.post("/lobby/" + gameId + "/update", lobbyInfo);
    }

    return {
        initialize: initialize
    }
});