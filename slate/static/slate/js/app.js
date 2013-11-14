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
            origin = Slate.Artboard.get_canvas_origin();

        Slate.Layer.invalidate_rectangle({
            x: -1 * origin.x - 10,
            y: -1 * origin.y - 10,
            width: Slate.Artboard.screen_to_canvas_zoom(canvas.width + 20),
            height: Slate.Artboard.screen_to_canvas_zoom(canvas.height + 20)
        });
        Slate.Layer.redraw_regions();

    }

    function initialize_application(data) {
        Slate.Artboard.update_origin_from_url();

        resize_canvas_surfaces();
        $(window).on("resize", resize_canvas_surfaces);

        $("#add_layer").on("click", Slate.Layer.add_new_layer);
        Slate.Drawing.add_drawing_events();
        Slate.Attributes.add_attribute_events();
        Slate.Artboard.add_zoom_events();

        Slate.Artboard.post_artboard_data(data);
        if (data.layers.length > 0){
            Slate.Layer.select_layer(data.layers[0].id);
        }

        $("#loading_cover").hide();
    }

    $(document).ready(function () {
        $.ajax(window.slate_home + '/rest/artboard/' + window.artboard_url_token, {
            success: initialize_application
        });
    });
})(jQuery);

