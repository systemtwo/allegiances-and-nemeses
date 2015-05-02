requirejs([], function() {
    $(document).ready(function() {
        var moduleSelect = $("#moduleSelect");
        $("#moduleLoad").click(function() {
            var moduleName = moduleSelect.val();
            if (moduleName) {
                openModule(moduleName);
            } else {
                moduleName = prompt("Module Name");
                $.post("/modules/create", {
                    moduleName: moduleName
                }).done(function() {
                    openModule(moduleName);
                })
            }
        });
    });

    function openModule(moduleName) {
         window.location.href = "/mapEditor/" + moduleName;
    }
});