(function($) {
 
    $.fn.simplecalendar = function(options) {
        var defaults = {
            visible: false, // show calendar at start (at first encounter)
            prevWeeks: 2,   // how many rows to show in the past
            nextDays: 180,  // for how many days in the future to span
            disabledDays: [6], // 0–Monday...6–Sunday
            disabledDates: ['11-05-2015'] // 'dd-mm-yyyy'
        };
        var settings = $.extend( {}, defaults, options );
        
        return this.each(function() {
            // TODO initialize
        });
    };
 
}( jQuery ));