(function($) {

    var $calendar = false;
 
    $.fn.simplecalendar = function(options) {
        var defaults = {
            prerender: false, // prerender calendar on init? TODO set to false
            visible: false, // show calendar at start (at first encounter)? TODO set to false
            prevWeeks: 2,   // how many rows to show in the past
            nextDays: 180,  // for how many days in the future to span
            disabledDays: [6], // 0–Monday...6–Sunday
            disabledDates: ['11-05-2015'] // 'dd-mm-yyyy'
        };
        var settings = $.extend({}, defaults, options);

        if (settings.prerender) prerender();
        
        var isVisible = false
        return this.each(function() {
            if (settings.visible && !isVisible) {
                isVisible = true;
                open(this);
            }
            // TODO bind focus events
        });
    };

    function prerender() {
        if ($calendar !== false) return;
        $calendar = $('div').html('HELLO');
        // TODO render

    }

    function open(input) {
        prerender();
        // TODO gather input data
        $calendar.prependTo(input).show();
    }
 
}( jQuery ));