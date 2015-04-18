import tornado.web
import tornado.template

import os.path
import json

import GameBoard
import utils


class MapEditorHandler(tornado.web.RequestHandler):
    actions = utils.Enum(["MODULE_SELECTOR", "PAGE", "MODULE", "CREATE"])

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
                moduleInfo["units"] = unitInfo.read()
            with open(GameBoard.Util.territoryFileName(moduleName)) as territoryInfo:
                moduleInfo["territories"] = territoryInfo.read()
            with open(GameBoard.Util.connectionFileName(moduleName)) as connections:
                moduleInfo["connections"] = connections.read()
            self.write(loader.load("mapEditor.html").generate(moduleInfo=moduleInfo))

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

    def post(self, **params):
        if self.action == self.actions.MODULE:
            moduleName = params["moduleName"]
            moduleInfo = json.loads(self.request.body)
            if os.path.exists(os.path.join(self.config.ABS_MODS_PATH, moduleName)):

                if "countries" in moduleInfo:
                    with open(GameBoard.Util.countryFileName(moduleName), 'w') as f:
                        f.write(json.dumps(moduleInfo["countries"]))
                if "units" in moduleInfo:
                    with open(GameBoard.Util.unitFileName(moduleName), 'w') as f:
                        f.write(json.dumps(moduleInfo["units"]))
                if "territories" in moduleInfo:
                    with open(GameBoard.Util.territoryFileName(moduleName), 'w') as f:
                        f.write(json.dumps(moduleInfo["territories"]))
                if "connections" in moduleInfo:
                    with open(GameBoard.Util.connectionFileName(moduleName), 'w') as f:
                        f.write(json.dumps(moduleInfo["connections"]))