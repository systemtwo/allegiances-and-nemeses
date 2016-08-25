from GameBoard.Phases.Phase import Phase
from GameBoard.Unit import createBoughtUnitFromDict


class BuyPhase(Phase):
    # noinspection PyMissingConstructor
    def __init__(self, board):
        # List[(unitType, cost)]
        self.board = board
        self.name = "BuyPhase"

    def setBuyList(self, buyList):
        """
        Sets the buy list for the board
        :param buyList: Array of BoughtUnits or Objects containing unitType and territory (the name of the territory)
        :return:
        """
        parsedBuyList = []
        for bought in buyList:
            if hasattr(bought, "unitType"):
                parsedBuyList.append(bought)
            elif isinstance(bought, dict) and u'unitType' in bought and u'territory' in bought:
                parsedBuyList.append(createBoughtUnitFromDict(bought, self.board.territories))
            else:
                raise Exception("Invalid buy list", buyList)

        sumCost = self.costOfUnits(parsedBuyList)

        if sumCost <= self.board.currentCountry.money:
            self.board.buyList = parsedBuyList[:]  # copy in buyList
            return True
        else:
            return False

    def costOfUnits(self, unitList):
        sumCost = 0
        # buyList is of type [{unitType: String, amount: int}]
        for bought in unitList:
            unitInfo = self.board.unitInfo(bought.unitType)
            sumCost += unitInfo.cost
        return sumCost

    def nextPhase(self):
        board = self.board
        board.currentCountry.pay(self.costOfUnits(board.buyList))
        board.setPhase("AttackPhase")
