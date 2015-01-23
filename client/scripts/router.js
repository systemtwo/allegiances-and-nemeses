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
    function nextPhase() {
        return sendAction({
            action: "nextPhase",
            currentPhase: _g.currentPhase.constructor.name // get the class name
        });
    }
    function endBuyPhase(boughtUnits) {
        return sendAction({
            action: "buy",
            boughtUnits: boughtUnits
        }).done(function() {
            console.log(arguments)
        })
    }
    function fetchBoard(boardId) {
        console.assert(boardId !== null, "Board Id not set");
        return $.getJSON("/boards/" + boardId);
    }
    function fetchBoards() {
        return $.getJSON("/boards");
    }
    function validateMove(start, end, unitIds, onfail) {
        return sendAction({
            action: "move",
            from: start.name,
            to: end.name,
            unitList: unitIds
        }).fail(onfail)
    }

    function getConflicts(boardId) {
        return $.getJSON("/conflicts/" + boardId);
    }

    function selectConflict(territoryName, onFail) {
        return sendAction({
            action: "selectConflict",
            territory: territoryName
        }).fail(onFail);
    }
    function battle(territoryName) {
        // Perform one tick of a battle
        // Success will return a BattleReport
        // Will fail if battling in the non-current conflict
        return sendAction({
            action: "battleTick",
            territory: territoryName
        });
    }
    function retreat(conflictTerritory, destination) {
        // Success will return a BattleReport
        // Will fail if battling in the non-current conflict
        return sendAction({
            action: "retreat",
            from: conflictTerritory,
            to: destination
        });
    }
    function autoResolve(territoryName) {
        // NO RETREAT. TO THE DEATH, BROTHERS!
        // Success will return a BattleReport
        // Will fail if battling in the non-current conflict
        return sendAction({
            action: "autoResolve",
            territory: territoryName
        });
    }
    function autoResolveAll() {
        // NO RETREAT. TO THE DEATH, BROTHERS!
        // Success will return a BattleReport
        // Will fail if battling in the non-current conflict
        var request = sendAction({
            action: "autoResolveAll"
        });
        request.fail(function onFail(){
            // Show an error?
        });
        return request;
    }
    function placeUnit(territoryName, unitType) {
        return sendAction({
            action: "placeUnit",
            territory: territoryName,
            unitType: unitType
        });
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
        getConflicts: getConflicts,
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
