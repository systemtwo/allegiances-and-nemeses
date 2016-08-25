import base64
import tornado.web
import tornado.template

import os.path
import json

import GameBoard
import utils
from config import STATIC_CONTENT_PATH


class MapEditorHandler(tornado.web.RequestHandler):
    actions = utils.Enum(["MODULE_SELECTOR", "PAGE", "LIST_IMAGES", "MODULE", "CREATE", "MODULE_INFO"])

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
            self.write(loader.load("mapEditor.html").generate(moduleName=moduleName))

        elif self.action == self.actions.MODULE_INFO:
            moduleName = params["moduleName"]
            moduleInfo = {
                "moduleName": moduleName
            }
            with open(GameBoard.Util.filePath(moduleName, "info.json")) as file:
                moduleInfo["metadata"] = json.load(file)

            if "stencilImage" in moduleInfo["metadata"]:
                stencilData = moduleInfo["metadata"]["stencilImage"]
                filePath = GameBoard.Util.filePath(moduleName, stencilData.pop("fileName"))
                with open(filePath, "rb") as imageFile:
                    stencilData["encoded"] = base64.b64encode(imageFile.read()).decode("utf-8")

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

            self.write(json.dumps(moduleInfo))

        elif self.action == self.actions.LIST_IMAGES:
            """
            If no directory provided, looks in top level images directory
            Returns an object containing the file names of the images in the given directory
            And the names of subdirectories
            Throws an error if directory does not exist
            """
            requestedDirectory = self.get_argument("directory", "")
            if requestedDirectory.__contains__(".."):
                self.send_error(500)
                return
            directory = os.path.join(STATIC_CONTENT_PATH, "images", requestedDirectory)
            images = []
            directories = []
            if os.path.isdir(directory):
                for f in os.listdir(directory):
                    absolutePath = os.path.join(directory, f)
                    if os.path.isfile(absolutePath):
                        images.append(f)
                    elif os.path.isdir(os.path.join(directory, f)):
                        directories.append(f)
                self.write(json.dumps({
                    "images": images,
                    "directories": directories
                }))
            else:
                self.send_error(500)

    def post(self, **params):
        if self.action == self.actions.MODULE:
            moduleName = params["moduleName"]
            moduleInfo = json.loads(self.request.body.decode("utf-8"))
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
