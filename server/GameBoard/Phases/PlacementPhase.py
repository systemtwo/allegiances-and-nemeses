from GameBoard.Phases.Phase import Phase
from GameBoard.Unit import createBoughtUnitFromDict, Unit


class PlacementPhase(Phase):
    # noinspection PyMissingConstructor
    def __init__(self, board):
        self.board = board
        self.name = "PlacementPhase"

        if len(self.board.buyList) == 0:
            self.nextPhase()

    def setBuyList(self, buyList):
        """
        Updates the buyList with where units should be place
        Does not allow the more units to be bought or sold
        :param buyList: Array of BoughtUnits or Objects containing unitType and territory (the name of the territory)
        :return:
        """
        currentListCopy = self.board.buyList[:]

        parsedBuyList = []
        for bought in buyList:
            if hasattr(bought, "unitType"):
                boughtUnit = bought
            elif isinstance(bought, dict) and u'unitType' in bought and u'territory' in bought:
                boughtUnit = createBoughtUnitFromDict(bought, self.board.territories)
            else:
                raise Exception("Invalid buy list", buyList)

            if boughtUnit in currentListCopy:
                currentListCopy.remove(boughtUnit)
                parsedBuyList.append(boughtUnit)
            else:
                raise Exception("Sneaky bugger trying to change the buy list")

        self.board.buyList = parsedBuyList[:]  # copy in buyList
        return True  # true for success, to match setBuyList in the buy phase

    def nextPhase(self):
        for u in self.board.buyList:
            unitInfo = self.board.unitInfo(u.unitType)
            if u.territory is not None:
                self.board.units.append(Unit(unitInfo, self.board.currentCountry, u.territory))
        self.board.collectIncome(self.board.currentCountry)

        self.board.nextTurn()
        self.board.setPhase("BuyPhase")
