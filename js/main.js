document.addEventListener("DOMContentLoaded", function() {
    AutoComplete();

    $('.dropdown-toggle').dropdown();
    $('#menu').collapse();

    $('pre').each(function(i, block) {
        hljs.highlightBlock(block);
    });

    $("[id^='installation-']").on("click", function() {
        $("[id^='installation-']").removeClass("btn-primary").addClass("btn-default");
        $(this).removeClass("btn-default").addClass("btn-primary");

        $("[data-id]").addClass("hide");
        $("[data-id='" + $(this).attr("id") + "']").removeClass("hide");
    });
});