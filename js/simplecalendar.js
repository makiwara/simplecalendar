(function($) {

    var $calendar = false;
 
    $.fn.simplecalendar = function(options) {
        var defaults = {
            prerender: true, // prerender calendar on init? TODO set to false
            visible: true, // show calendar at start (at first encounter)? TODO set to false
            prevWeeks: 2,   // how many rows to show in the past
            nextDays: 180,  // for how many days in the future to span
            disabledDays: [6], // 0–Monday...6–Sunday (even if starts from Sunday)
            disabledDates: ['11-03-2015'], //  Dates or 'dd-mm-yyyy'
            anchorDate: false, // to anchor not on today
            languagePackage: {
                months: ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEMPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'],
                weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], 
                startsSunday: false, // TODO support
            },
            cssPrefix: 'simplecalendar'
        };
        var settings = $.extend({}, defaults, options);
        // Patch settings a little bit: prepare correct anchor date, disabled dates, 
        // and shift disabledDays/weekdays if startsSunday
        if (settings.anchorDate === false) settings.anchorDate = new Date();
        if (typeof settings.anchorDate == 'string') settings.anchorDate = dateFromString(settings.anchorDate);
        for (var i=0; i<settings.disabledDates.length; i++) {
            if (typeof settings.disabledDates[i] == 'date') 
                settings.disabledDates[i] = dateToString(settings.disabledDates[i]);
        }
        if (settings.languagePackage.startsSunday) {
            for (var i=0; i<settings.disabledDays.length; i++)
                settings.disabledDays[i] = (settings.disabledDays[i]+1)%7;
            var sunday = settings.languagePackage.weekdays[ settings.languagePackage.weekdays.length-1 ];
            for (var i=0; i<settings.languagePackage.weekdays.length-1; i++)
                settings.languagePackage.weekdays[i+1] = settings.languagePackage.weekdays[i];
            settings.languagePackage.weekdays[0] = sunday;
        }
        // prepare and bind
        if (settings.prerender) view_prerender();
        var isVisible = false
        return this.each(function() {
            if (settings.visible && !isVisible) {
                isVisible = true;
                controller_open(this);
            }
            // TODO bind focus events
        });

        // =====================================================================================
        // =====================================================================================
        // Utility functions
        // =====================================================================================

        function css(suffix) { return settings.cssPrefix+'-'+suffix }
        function dotcss(suffix) { return '.'+css(suffix) }
        function dateFromString(s) { // dd-mm-yyyy
            s = s.split('-');
            return new Date(parseInt(s[2], 10), parseInt(s[1], 10)-1, parseInt(s[0], 10));
        }
        function rjust(s, width, padding) {
            s = String(s);
            padding = padding || "0";
            padding = padding.substr(0,1)
            if( s.length < width )
                for( var i = 0, buf = ""; i < width - s.length ; i++ ) 
                    s = padding + s;
            return s;
        }
        function dateToString(d) { // dd-mm-yyyy
            return [rjust(d.getDate(),2), rjust(d.getMonth()+1,2), d.getFullYear()].join("-");
        }
        function findDay0(date, shiftLeft) {
            var offset = date.getDay();
            if (!settings.languagePackage.startsSunday) offset = (offset+6)%7;
            var d = new Date(date)
            d.setDate(date.getDate()-offset-shiftLeft);
            return d;
        }
        function findDayLast(date, shiftRight) { 
            return findDay0(date, 7-shiftRight);
        }
        function getShortMonth(date) {
            var month = settings.languagePackage.months[date.getMonth()].toUpperCase().substr(0,3);
            return [month.charAt(0), month.charAt(1), month.charAt(2)].join(" ");
        }
        

        // =====================================================================================
        // =====================================================================================
        // VIEW (rendering, patching)
        // =====================================================================================

        function view_prerender() {
            if ($calendar !== false) return;
            $calendar = $('<div>').addClass(settings.cssPrefix);
            $calendar
                .append($('<div>').addClass(css('angle')))
                .append($('<div>').addClass(css('head'))
                    .append($('<div>').addClass(css('close')).html('&times;'))
                    .append($('<div>').addClass(css('month')))
                    .append($('<div>').addClass(css('week')))
                )
                .append($('<div>').addClass(css('bodywrap')).append($('<div>').addClass(css('body'))))

            // build weekday title
            var $week = $calendar.find(dotcss('week'));
            for (var i=0; i<7; i++) {
                var $day = $('<div>').html(settings.languagePackage.weekdays[i]);
                if (settings.disabledDays.indexOf(i) >= 0) $day.addClass(css('disabled'));
                $week.append($day);
            }
            $week.append($('<br clear="all">'))

            // build body rows
            var $body = $calendar.find(dotcss('body'));
            var day0    = findDay0   (settings.anchorDate, settings.prevWeeks*7);
            var dayLast = findDayLast(settings.anchorDate, settings.nextDays);
            var day = day0;
            while (day < dayLast) {
                var $w = $('<div>').addClass(css('row'));
                for (var i=0; i<7; i++) {
                    var $day = $('<div>').html(day.getDate())
                    if (day.getDate() == 1) 
                        $day.prepend($('<div>').addClass(css('split')).html(getShortMonth(day)))
                    var weekday = day.getDay();
                    if (!settings.languagePackage.startsSunday) weekday = (weekday+6)%7;
                    if ((day < settings.anchorDate) ||
                        (settings.disabledDays.indexOf(weekday) >= 0) || 
                        (settings.disabledDates.indexOf(dateToString(day)) >= 0))
                        $day.addClass(css('disabled'));
                    $w.append($day);
                    day.setDate(day.getDate()+1);
                }
                $w.append($('<br clear="all">'))
                $body.append($w);
            }
        }

        function view_updateMonth() {
            $calendar.find(dotcss('body'))
        }


        // =====================================================================================
        // =====================================================================================
        // CONTROLLERS (open, close, select)
        // =====================================================================================

        function controller_open(input) {
            prerender();
            // TODO gather input data
            // TODO patch calendar view
            $calendar.insertBefore(input).show();
            view_updateMonth()
        }
    };
}( jQuery ));