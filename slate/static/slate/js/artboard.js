Slate.Artboard = (function ($) {
    "use strict";
    var periodic_update_data = {},
        canvas_origin_x = 0,
        canvas_origin_y = 0,
        canvas_zoom_factor = 0,
        ZOOM_BASE = 2; // Arbitrary - zoom is this raised to the zoom level.

    function update_origin_from_url() {
        var test_match = [window.slate_home, "/board/", window.artboard_url_token, "/([-0-9]+),([-0-9]+)"].join(""),
            matches = window.location.href.match(test_match),
            origin_x,
            origin_y;

        if (matches) {
            origin_x = parseFloat(matches[1]);
            origin_y = parseFloat(matches[2]);

            update_display_origin(origin_x, origin_y);
        }
    }

    function post_artboard_data(data) {
        var i;
        $("#layers_sidebar_sortable").sortable({
            update: Slate.Layer.reorder_layers
        });
        periodic_update_data.last_check_date = data.date;

        for (i = 0; i < data.layers.length; i++) {
            Slate.Layer.add_layer_from_server(data.layers[i]);
        }

        for (i = 0; i < data.shapes.length; i++) {
            Slate.Drawing.add_shape_from_server(data.shapes[i]);
        }

        if (data.modified_shapes) {
            for (i = 0; i < data.modified_shapes.length; i++) {
                Slate.Drawing.update_shape_from_server(data.modified_shapes[i]);
            }
        }

        if (data.shapes.length) {
            Slate.Layer.draw_layer_previews();
        }
        Slate.Layer.redraw_regions();


        window.setTimeout(run_periodic_update, 2000);
    }

    function run_periodic_update() {
        $.ajax(window.slate_home + '/rest/artboard/' + window.artboard_url_token + "/from/" + periodic_update_data.last_check_date, {
            success: post_artboard_data
        });
    }

    function get_canvas_origin() {
        return {
            x: canvas_origin_x,
            y: canvas_origin_y
        };
    }

    function set_canvas_origin(x, y) {
        canvas_origin_x = x;
        canvas_origin_y = y;
    }

    function canvas_to_screen_zoom(val) {
        return val * get_zoom_scale();
    }

    function screen_to_canvas_zoom(val) {
        return val / get_zoom_scale();
    }

    function get_zoom_level() {
        return canvas_zoom_factor;
    }

    function get_zoom_scale() {
        return Math.pow(ZOOM_BASE, get_zoom_level());
    }

    function zoom_in() {
        canvas_zoom_factor++;
        update_zoom_display();
    }

    function zoom_out() {
        canvas_zoom_factor--;
        update_zoom_display();
    }

    function on_change_zoom_input() {
        var new_value = $("#zoom_level_display").val();

        if (parseInt(new_value) == new_value) {
            canvas_zoom_factor = parseInt(new_value);
        }

        update_zoom_display();
    }

    function update_zoom_display() {
        $("#zoom_level_display").val(canvas_zoom_factor);
    }

    function add_zoom_events() {
        $(".zoom_in").on("click", zoom_in);
        $(".zoom_out").on("click", zoom_out);
        $("#zoom_level_display").on("change", on_change_zoom_input);
    }

    return {
        post_artboard_data: post_artboard_data,
        update_origin_from_url: update_origin_from_url,
        get_canvas_origin: get_canvas_origin,
        set_canvas_origin: set_canvas_origin,
        get_zoom_level: get_zoom_level,
        get_zoom_scale: get_zoom_scale,
        canvas_to_screen_zoom: canvas_to_screen_zoom,
        screen_to_canvas_zoom: screen_to_canvas_zoom,
        add_zoom_events: add_zoom_events
    };


})(jQuery);
