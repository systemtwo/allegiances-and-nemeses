import tornado.web
import tornado.template

import os.path
import json

import GameBoard
import utils
import config


class MapEditorHandler(tornado.web.RequestHandler):
    actions = utils.Enum(["MODULE_SELECTOR", "PAGE", "LIST_IMAGES", "MODULE", "CREATE"])

    def initialize(self, action, config, html_path=""):
        self.HTML_PATH = html_path
        self.action = action
        self.config = config

    def get(self, **params):
        loader = tornado.template.Loader(self.HTML_PATH)
        if self.action == self.actions.MODULE_SELECTOR:
            # moduleNames = os.listdir(self.config.ABS_MODS_PATH)
            moduleNames = ["napoleon"]
            self.write(loader.load("moduleSelector.html").generate(moduleNames=moduleNames))

        elif self.action == self.actions.PAGE:
            moduleName = params["moduleName"]
            moduleInfo = {
                "moduleName": moduleName
            }
            with open(GameBoard.Util.countryFileName(moduleName)) as countryInfo:
                moduleInfo["countries"] = countryInfo.read()
            with open(GameBoard.Util.unitFileName(moduleName)) as unitInfo:
                moduleInfo["unitCatalogue"] = unitInfo.read()
            with open(GameBoard.Util.territoryFileName(moduleName)) as territoryInfo:
                moduleInfo["territories"] = territoryInfo.read()
            with open(GameBoard.Util.connectionFileName(moduleName)) as connections:
                moduleInfo["connections"] = connections.read()
            with open(GameBoard.Util.filePath(moduleName, "unitSetup.json")) as connections:
                moduleInfo["unitSetup"] = connections.read()
            self.write(loader.load("mapEditor.html").generate(moduleInfo=moduleInfo))

        elif self.action == self.actions.LIST_IMAGES:
            directory = os.path.join(config.STATIC_CONTENT_PATH, "images", self.get_argument("directory", ""))
            fileNames = []  # empty list if directory does not exists
            if os.path.isdir(directory):
                fileNames = [f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))]
            self.write(json.dumps(fileNames))

    def post(self, **params):
        if self.action == self.actions.MODULE:
            moduleName = params["moduleName"]
            moduleInfo = json.loads(self.request.body)
            if os.path.exists(os.path.join(self.config.ABS_MODS_PATH, moduleName)):
                def writeFile(key, fileName):
                    if key in moduleInfo:
                        with open(fileName, "w") as f:
                            f.write(json.dumps(moduleInfo[key], indent=4, sort_keys=True))

                writeFile("countries", GameBoard.Util.countryFileName(moduleName))
                writeFile("units", GameBoard.Util.unitFileName(moduleName))
                writeFile("territories", GameBoard.Util.territoryFileName(moduleName))
                writeFile("connections", GameBoard.Util.connectionFileName(moduleName))
                writeFile("unitSetup", GameBoard.Util.filePath(moduleName, "unitSetup.json"))

        elif self.action == self.actions.CREATE:
            moduleName = self.get_argument("moduleName")
            if not os.path.exists(os.path.join(self.config.ABS_MODS_PATH, moduleName)):
                os.makedirs(os.path.join(self.config.ABS_MODS_PATH, moduleName))
                with open(GameBoard.Util.countryFileName(moduleName), 'w') as f:
                    f.write("[]")
                with open(GameBoard.Util.unitFileName(moduleName), 'w') as f:
                    f.write("{}")
                with open(GameBoard.Util.territoryFileName(moduleName), 'w') as f:
                    f.write("[]")
                with open(GameBoard.Util.connectionFileName(moduleName), 'w') as f:
                    f.write("[]")
                with open(GameBoard.Util.filePath(moduleName, "unitSetup.json"), 'w') as f:
                    f.write("{}")
