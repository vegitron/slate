Slate.Artboard = (function ($) {
    "use strict";
    var periodic_update_data = {};
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

        periodic_update_data.last_check_date = data.date;

        for (i = 0; i < data.layers.length; i++) {
            add_layer_from_server(data.layers[i]);
        }

        for (i = 0; i < data.shapes.length; i++) {
            add_shape_from_server(data.shapes[i]);
        }

        if (data.modified_shapes) {
            for (i = 0; i < data.modified_shapes.length; i++) {
                update_shape_from_server(data.modified_shapes[i]);
            }
        }

        if (data.shapes.length) {
            draw_layer_previews();
        }
        redraw_regions();


        window.setTimeout(run_periodic_update, 2000);
    }

    function run_periodic_update() {
        $.ajax(window.slate_home + '/rest/artboard/' + window.artboard_url_token + "/from/" + periodic_update_data.last_check_date, {
            success: post_artboard_data
        });
    }

    return {
        post_artboard_data: post_artboard_data,
        update_origin_from_url: update_origin_from_url
    };
})(jQuery);
