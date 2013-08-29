var app_context = {};

var Slate = {};

(function ($) {
    "use strict";
    function resize_canvas_surfaces() {
        // Doing this, because $().width() with set a style - but that scales the
        // canvas up, instead of resizing it.
        document.getElementById("artboard").width = $(window).width();
        document.getElementById("artboard").height = $(window).height();

        document.getElementById("draw_surface").width = $(window).width();
        document.getElementById("draw_surface").height = $(window).height();

        var canvas = document.getElementById("artboard"),
            origin = get_canvas_origin();

        invalidate_rectangle({
            x: -1 * origin.x - 10,
            y: -1 * origin.y - 10,
            width: canvas.width + 20,
            height: canvas.height + 20
        });
        redraw_regions();

    }

    function initialize_application(data) {
        Slate.Artboard.update_origin_from_url();

        resize_canvas_surfaces();
        $(window).on("resize", resize_canvas_surfaces);

        $("#add_layer").on("click", add_new_layer);
        add_drawing_events();
        Slate.Attributes.add_attribute_events();

        Slate.Artboard.post_artboard_data(data);

        $("#loading_cover").hide();
    }

    $(document).ready(function () {
        $.ajax(window.slate_home + '/rest/artboard/' + window.artboard_url_token, {
            success: initialize_application
        });
    });
})(jQuery);

