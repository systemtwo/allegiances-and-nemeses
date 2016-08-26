define(['underscore', 'knockout', "text!../templates/lobbyInfo.ko.html", "dragula"], function (_, ko, template, dragula) {
    var gameId = null;
    var viewModel = null;
    var userId = null;

    // takes in constants from the server. The params here should never change
    function initialize(gameIdParam, userIdParam) {
        gameId = gameIdParam;
        userId = userIdParam;

        $.when(fetchLobbyInfo(), fetchModulesInfo()).done(function (response, modules) {
            viewModel = initViewModel(JSON.parse(modules[0]), response[0]);

            ko.applyBindings(viewModel, $("#lobby-info-container").append(template)[0]);

            if (viewModel.canEdit()) {
                var api = dragula({
                    isContainer: function (el) {
                        return el.classList.contains('countries-area') ||
                            el.classList.contains("unclaimed-countries");
                    }
                });

                api.on("drop", function (el, container, origin) {
                    api.remove(); // don't let dragula move the DOM around
                    var countryName = $(el).data("country-name");
                    var $container = $(container);
                    var $origin = $(origin);
                    if ($container.hasClass("countries-area")) {
                        var playerId = $container.closest(".player-info").data("player-id");
                        viewModel.addCountryToPlayer(countryName, playerId);
                    }

                    if ($origin.hasClass("countries-area")) {
                        var playerId = $origin.closest(".player-info").data("player-id");
                        viewModel.removeCountryFromPlayer(countryName, playerId);
                    }
                });
            }
        });
    }

    function initViewModel(modules, initialLobbyInfo) {
        function LobbyInfoViewModel() {
            var vm = this;
            vm.modules = modules;
            // array of player id and name
            vm._players = ko.observableArray(initialLobbyInfo.players);
            vm._countryAssignmentsNotifier = ko.observable();

            vm.canEdit = ko.computed(function () {
                return initialLobbyInfo.creatorId == userId;
            });
            vm.roomName = ko.observable(initialLobbyInfo.name);
            vm.selectedModule = ko.observable(initialLobbyInfo.module);
            vm.selectedMaxPlayersOption = ko.observable(initialLobbyInfo.maxPlayers);

            vm._countries = ko.computed(function () {
                var selectedModule = vm.selectedModule();
                if (selectedModule) {
                    return selectedModule.countries.filter(function (c) {return c.playable});
                } else {
                    return [];
                }
            });
            vm.maxPlayersOptions = function () {
                var selectedModule = vm.selectedModule();
                var maxPlayerOptions = [];

                if (selectedModule) {
                    var playableCountries = selectedModule.countries.filter(function (c) {return c.playable}).length;
                    for (var i = 1; i <= playableCountries; i++) {
                        maxPlayerOptions.push(i);
                    }
                }

                return maxPlayerOptions;
            };

            vm.unassignedCountries = ko.pureComputed(function () {
                vm._countryAssignmentsNotifier(); // depend on this
                return vm._countries().filter(function (country) {
                    return _.every(vm._players(), function (player) {
                        return !_.contains(player.assignedCountries, country.name);
                    })
                })
            });

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
            vm.addCountryToPlayer = function(countryName, playerId) {
                var players = vm._players();
                var player = _.findWhere(players, {id: playerId});
                if (player) {
                    player.assignedCountries.push(countryName);
                    vm._countryAssignmentsNotifier.notifySubscribers();
                }
            };

            vm.removeCountryFromPlayer = function (countryName, playerId) {
                var players = vm._players();
                var player = _.findWhere(players, {id: playerId});
                if (player) {
                    player.assignedCountries = player.assignedCountries.filter(function (c) { return c != countryName});
                    vm._countryAssignmentsNotifier.notifySubscribers();
                }
            };

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

    function fetchModulesInfo() {
        return $.get("/modules/list");
    }

    function saveLobbyInfo(lobbyInfo) {
        return $.post("/lobby/" + gameId + "/update", lobbyInfo);
    }

    return {
        initialize: initialize
    }
});