import os.path
class ErrorRenderMixin(object):
    def write_error(self, status_code, **kwargs):
        #FIXME: How to ensure ERROR_TEMPLATE_PATH exists without init?
        self.render(os.path.join("..", self.ERROR_TEMPLATE_PATH, "error.html"))
