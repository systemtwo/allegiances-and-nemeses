import os.path

import os
class ErrorRenderMixin(object):
    def initialize(self, *args, **kwargs):
        super(ErrorRenderMixin, self).initialize(*args, **kwargs)
        self.ERROR_TEMPLATE_PATH = None

    def write_error(self, status_code, **kwargs):
        if self.ERROR_TEMPLATE_PATH is None:
            raise ValueError("ERROR_TEMPLATE_PATH is None. Set an ERROR_TEMPLATE_PATH")

        renderArguments = {
            "status_code": status_code,
        }
        self.render(os.path.join("..", self.ERROR_TEMPLATE_PATH, "error.html"), **renderArguments)
