#Package init

#For import *
__all__ = ["Board", "Country", "Phases", "Territory", "Unit", "Util"]


#Lets move some classes into this namespace (so we do not need to do Board.Board())
from Board import Board
from Country import Country
from Unit import Unit
import Util

import Phases
