app_context.periodic_update_data = {};

function update_origin_from_url() {
    var test_match = [slate_home, "\/board\/", artboard_url_token, "\/([\-0-9]+),([\-0-9]+)"].join("")

    var matches = window.location.href.match(test_match);
    if (matches) {
        var origin_x = parseFloat(matches[1]);
        var origin_y = parseFloat(matches[2]);
        update_display_origin(origin_x, origin_y);
    }
}

function run_periodic_update() {
    $.ajax(slate_home+'/rest/artboard/'+artboard_url_token+"/from/"+app_context.periodic_update_data.last_check_date, {
        success: post_artboard_data
    })
}

function post_artboard_data(data) {
    app_context.periodic_update_data.last_check_date = data.date;

    for (var i = 0; i < data.layers.length; i++) {
        add_layer_from_server(data.layers[i]);
    }

    for (var i = 0; i < data.shapes.length; i++) {
        add_shape_from_server(data.shapes[i]);
    }

    if (data.shapes.length) {
        draw_layer_previews();
    }
    redraw_regions();


    window.setTimeout(run_periodic_update, 2000);
}

