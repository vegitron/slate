app_context.layer_data = {
    layers: [],
    selected_layer: null
};

function add_new_layer() {
    var layer_id = app_context.layer_data.layers.length + 1;

    var new_display_div = document.createElement("div");
    new_display_div.innerHTML = load_template("layer_sidebar")({ layer_id: layer_id });

    app_context.layer_data.layers.push({
        id: layer_id,
        z_index: layer_id
    });

    document.getElementById("layers_sidebar").appendChild(new_display_div);

    $("#layer_sidebar_"+layer_id).on("click", function() {
        select_layer(layer_id);
    });
    select_layer(layer_id);
}

function select_layer(id) {
    var last_selected = app_context.layer_data.selected_layer;
    if (last_selected) {
        $("#layer_sidebar_"+last_selected).removeClass("selected");
    }

    app_context.layer_data.selected_layer = id;

    $("#layer_sidebar_"+id).addClass("selected");
}

