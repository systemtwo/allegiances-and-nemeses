import tornado.web

import os.path
import json

import GameBoard
import utils

class MapEditorHandler(tornado.web.RequestHandler):
    actions = utils.Enum(["PAGE", "MODULES", "MODULE_INFO", "CREATE"])

    def initialize(self, action, config, html_path=""):
        self.HTML_PATH = html_path
        self.action = action
        self.config = config

    def get(self, **params):
        if self.action == self.actions.PAGE:
            # surely there's a better way of handling this
            with open(os.path.join(self.HTML_PATH, "mapEditor.html")) as f:
                self.write(f.read())
        elif self.action == self.actions.MODULES:
            moduleNames = os.listdir(self.config.MODS_PATH)
            self.write(json.dumps(moduleNames))
        elif self.action == self.actions.MODULE_INFO:
            returnObject = {}
            moduleName = params["moduleName"]
            with open(GameBoard.Util.countryFileName(moduleName)) as countryInfo:
                returnObject["countries"] = countryInfo.read()

            with open(GameBoard.Util.unitFileName(moduleName)) as unitInfo:
                returnObject["units"] = unitInfo.read()

            with open(GameBoard.Util.territoryFileName(moduleName)) as territoryInfo:
                returnObject["territories"] = territoryInfo.read()

            with open(GameBoard.Util.connectionFileName(moduleName)) as connections:
                returnObject["connections"] = connections.read()

            with open(GameBoard.Util.filePath(moduleName, "info.json")) as file:
                info = json.load(file)
                returnObject["wrapsHorizontally"] = info["wrapsHorizontally"]
                if "imageName" in info:
                    returnObject["imagePath"] = os.path.join(self.config.MODS_PATH, moduleName, info["imageName"])
                else:
                    returnObject["imagePath"] = self.config.DEFAULT_IMAGE_PATH  # convert to config var when convenient

            self.write(json.dumps(returnObject))
        elif self.action == self.actions.CREATE:
            moduleName = self.get_argument("moduleName")
            if not os.path.exists(os.path.join(self.config.MODS_PATH, moduleName)):
                os.makedirs(os.path.join(self.config.MODS_PATH, moduleName))
                with open(GameBoard.Util.countryFileName(moduleName), 'w') as f:
                    f.write("[]")
                with open(GameBoard.Util.unitFileName(moduleName), 'w') as f:
                    f.write("{}")
                with open(GameBoard.Util.territoryFileName(moduleName), 'w') as f:
                    f.write("[]")
                with open(GameBoard.Util.connectionFileName(moduleName), 'w') as f:
                    f.write("[]")
                with open(GameBoard.Util.filePath(moduleName, "info.json"), "w") as file:
                    file.write(json.dumps({
                        "wrapsHorizontally": False
                    }))
