
app_context.event_data = {
    cursor_events: [],
    mousedown_events: [],
    current_cursor: '',
};

function clear_mousedown_regions() {
    app_context.event_data.mousedown_events = [];
}

function clear_cursor_regions() {
    app_context.event_data.cursor_events = [];
}

function set_cursor_region(region, cursor) {
    app_context.event_data.cursor_events.push({
        region: region,
        cursor: cursor
    });
}

function set_mousedown_region(region, callback) {
    app_context.event_data.mousedown_events.push({
        region: region,
        callback: callback
    });
}

function handle_canvas_mousedown_events(x, y) {
    for (var i = 0; i < app_context.event_data.mousedown_events.length; i++) {
        var possible_event = app_context.event_data.mousedown_events[i];

        if (area_overlap(possible_event.region, { x: x, y: y, width: 1, height: 1 })) {
            var ev_val = possible_event.callback.apply(undefined, [x, y]);
            if (ev_val === false) {
                return false;
            }
        }
    }
}

function handle_canvas_cursor_events(x, y) {
    var found_cursor = false;
    var set_cursor = 'auto';

    for (var i = 0; i < app_context.event_data.cursor_events.length; i++) {
        if (area_overlap(app_context.event_data.cursor_events[i].region, { x: x, y: y, width: 1, height: 1 })) {
            found_cursor = true;
            set_cursor = app_context.event_data.cursor_events[i].cursor;
            break;
        }
    }

    if (set_cursor != app_context.event_data.cursor) {
        $("body").css("cursor", set_cursor);
    }
}

