
Slate.Event = (function ($) {
    "use strict";
    var mousedown_events = [],
        cursor_events = [],
        current_cursor = '';

    function clear_mousedown_regions() {
        mousedown_events = [];
    }

    function clear_cursor_regions() {
        cursor_events = [];
    }

    function set_cursor_region(region, cursor) {
        cursor_events.push({
            region: region,
            cursor: cursor
        });
    }

    function set_mousedown_region(region, callback, args) {
        mousedown_events.push({
            region: region,
            callback: callback,
            args: args
        });
    }

    function handle_canvas_mousedown_events(x, y) {
        var i,
            passed_args,
            args,
            ev_val;

        for (i = 0; i < mousedown_events.length; i++) {
            var possible_event = mousedown_events[i];

            if (area_overlap(possible_event.region, { x: x, y: y, width: 1, height: 1 })) {
                passed_args = [x, y];
                args = possible_event.args || [];
                passed_args = passed_args.concat(args);
                ev_val = possible_event.callback.apply(undefined, passed_args);
                if (ev_val === false) {
                    return false;
                }
            }
        }
    }

    function handle_canvas_cursor_events(x, y) {
        var found_cursor = false,
            set_cursor = 'auto',
            i;

        for (i = 0; i < cursor_events.length; i++) {
            if (area_overlap(cursor_events[i].region, { x: x, y: y, width: 1, height: 1 })) {
                found_cursor = true;
                set_cursor = cursor_events[i].cursor;
                break;
            }
        }

        if (set_cursor !== current_cursor) {
            current_cursor = set_cursor;
            $("body").css("cursor", set_cursor);
        }
    }

    return {
        set_cursor_region: set_cursor_region,
        set_mousedown_region: set_mousedown_region,
        clear_cursor_regions: clear_cursor_regions,
        clear_mousedown_regions: clear_mousedown_regions,
        handle_canvas_cursor_events: handle_canvas_cursor_events,
        handle_canvas_mousedown_events: handle_canvas_mousedown_events
    };

})(jQuery);
