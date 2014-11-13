define(["globals"], function(_g) {
    // All router functions return the request object, which can then have done and fail handlers added to it
    function sendToServer(data) {
        return $.ajax("/boards/" + _g.board.id + "/action", {
            data: data
        });
    }
    // Tell the server what you think the current phase is, and ask it to advance to the next. Ask it politely.
    // This is called by Attack, Move, and Place phases ONLY
    // Buy Phase ends with "endBuyPhase"
    // Resolve phase ends when there are no more conflicts
    function nextPhase(onSuccess) {
        sendToServer({
            action: "nextPhase",
            currentPhase: _g.currentPhase.constructor.name // get the class name
        }).done(onSuccess);
    }
    function endBuyPhase(boughtUnits) {
        return sendToServer({
            action: "buy",
            boughtUnits: JSON.stringify(boughtUnits)
        }).done(function() {
            console.log(arguments)
        })
    }
    function fetchBoard(boardId, onSuccess) {
        console.assert(boardId !== null, "Board Id not set");
        return $.getJSON("/boards/" + boardId).done(onSuccess);
    }
    function validateMove(start, end, units, onfail) {
        var unitIds = units.map(function(u) {
            return u.id
        });
        return sendToServer({
            action: "move",
            from: start,
            to: end,
            unitList: JSON.stringify(unitIds)
        }).fail(onfail)
    }
    function selectConflict(territoryName, onFail) {
        return sendToServer({
            action: "selectConflict",
            territory: territoryName
        }).fail(onFail);
    }
    function battle(territoryName, onSuccess, onFail) {
        // Perform one tick of a battle
        // Success will return a BattleReport
        // Will fail if battling in the non-current conflict
        return sendToServer({
            action: "battleTick",
            territory: territoryName
        })
            .done(onSuccess)
            .fail(onFail);

    }
    function retreat(conflictTerritory, destination, onSuccess, onFail) {
        // Success will return a BattleReport
        // Will fail if battling in the non-current conflict
        return sendToServer({
            action: "retreat",
            from: conflictTerritory,
            to: destination
        })
            .done(onSuccess)
            .fail(onFail);
    }
    function autoResolve(territoryName, onSuccess, onFail) {
        // NO RETREAT. TO THE DEATH, BROTHERS!
        // Success will return a BattleReport
        // Will fail if battling in the non-current conflict
        return sendToServer({
            action: "autoResolve",
            territory: territoryName
        })
            .done(onSuccess)
            .fail(onFail);
    }
    function autoResolveAll(onSuccess) {
        // NO RETREAT. TO THE DEATH, BROTHERS!
        // Success will return a BattleReport
        // Will fail if battling in the non-current conflict
        var request = sendToServer({
            action: "autoResolveAll"
        });
        request.done(onSuccess);
        request.fail(function onFail(){
            // Show an error?
        });
    }
    function placeUnit(territoryName, unitType, onFail) {
        return sendToServer({
            action: "placeUnit",
            territory: territoryName,
            unitType: unitType
        }).fail(onFail);
    }
    function getEventLog() {
        return sendToServer({
            action: "getEventLog"
        });
    }
    return {
        endBuyPhase: endBuyPhase,
        fetchBoard: fetchBoard,
        validateMove: validateMove,
        selectConflict: selectConflict,
        battle: battle,
        autoResolve: autoResolve,
        autoResolveAll: autoResolveAll,
        retreat: retreat,
        placeUnit: placeUnit,
        nextPhase: nextPhase
    }

});
