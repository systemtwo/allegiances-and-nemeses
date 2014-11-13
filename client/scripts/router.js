define(["globals"], function(_g) {
    // All router functions return the request object, which can then have done and fail handlers added to it
    function sendAction(data) {
        return $.ajax("/boards/" + _g.board.id + "/action", {
            method: "POST",
            data: JSON.stringify(data),
            contentType: 'application/json'
        });
    }
    function newBoard() {
        return $.ajax("boards/new", {
            method: "POST"
        });
    }
    // Tell the server what you think the current phase is, and ask it to advance to the next. Ask it politely.
    // This is called by Attack, Move, and Place phases ONLY
    // Buy Phase ends with "endBuyPhase"
    // Resolve phase ends when there are no more conflicts
    function nextPhase(onSuccess) {
        sendAction({
            action: "nextPhase",
            currentPhase: _g.currentPhase.constructor.name // get the class name
        }).done(onSuccess);
    }
    function endBuyPhase(boughtUnits) {
        return sendAction({
            action: "buy",
            boughtUnits: boughtUnits
        }).done(function() {
            console.log(arguments)
        })
    }
    function fetchBoard(boardId, onSuccess) {
        console.assert(boardId !== null, "Board Id not set");
        return $.getJSON("/boards/" + boardId).done(onSuccess);
    }
    function fetchBoards(onSuccess) {
        return $.getJSON("/boards").done(onSuccess);
    }
    function validateMove(start, end, units, onfail) {
        var unitIds = units.map(function(u) {
            return u.id
        });
        return sendAction({
            action: "move",
            from: start,
            to: end,
            unitList: unitIds
        }).fail(onfail)
    }
    function selectConflict(territoryName, onFail) {
        return sendAction({
            action: "selectConflict",
            territory: territoryName
        }).fail(onFail);
    }
    function battle(territoryName, onSuccess, onFail) {
        // Perform one tick of a battle
        // Success will return a BattleReport
        // Will fail if battling in the non-current conflict
        return sendAction({
            action: "battleTick",
            territory: territoryName
        })
            .done(onSuccess)
            .fail(onFail);

    }
    function retreat(conflictTerritory, destination, onSuccess, onFail) {
        // Success will return a BattleReport
        // Will fail if battling in the non-current conflict
        return sendAction({
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
        return sendAction({
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
        var request = sendAction({
            action: "autoResolveAll"
        });
        request.done(onSuccess);
        request.fail(function onFail(){
            // Show an error?
        });
    }
    function placeUnit(territoryName, unitType, onFail) {
        return sendAction({
            action: "placeUnit",
            territory: territoryName,
            unitType: unitType
        }).fail(onFail);
    }
    function getEventLog() {
        return sendAction({
            action: "getEventLog"
        });
    }
    return {
        newBoard: newBoard,
        endBuyPhase: endBuyPhase,
        fetchBoard: fetchBoard,
        fetchBoards: fetchBoards,
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
