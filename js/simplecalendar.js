(function($) {


    // Each $().simplecalendar spawns its own calendar with its own settings (language or size could differ)
    // To achieve singleton behavior close_registry is introduced. All view_close() functions are stored
    // in the registry to be called from controller_close().
    var close_registry = [];
 
    $.fn.simplecalendar = function(options) {
        var $calendar = false;
        var $curtain  = false;

        var defaults = {
            prerender: true,   // prerender calendar on init? 
            visible: false,    // show calendar at start (at first encounter)? 
            prevWeeks: 2,      // how many rows to show in the past
            nextDays: 180,     // for how many days in the future to span
            rows: 8,           // how many rows in calendar popup?
            disabledDays: [6], // 0–Monday...6–Sunday (even if starts from Sunday)
            disabledDates: ['11-03-2015'], //  Dates or 'dd-mm-yyyy'
            anchorDate: false, // to anchor not on today
            languagePackage: {
                months: ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEMPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'],
                weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], 
                startsSunday: false
            },
            offset: { 
                left: 100,  // px or % of input width
                top: '50%', // px or % of input height 
                shift: '50%' // px or % of calendar height
            },
            cssPrefix: 'simplecalendar'
        };
        var settings = $.extend({}, defaults, options);
        // Let's patch settings a little bit: prepare correct anchor date, disabled dates, 
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
            for (var i=settings.languagePackage.weekdays.length-2; i>=0; i--)
                settings.languagePackage.weekdays[i+1] = settings.languagePackage.weekdays[i];
            settings.languagePackage.weekdays[0] = sunday;
        }

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
        var rowHeight = 51;
        var monthHeights = [];

        function view_prerender() {
            if ($calendar !== false) return;

            $calendar = $('<div>').addClass(settings.cssPrefix);
            $calendar
                .append($('<div>').addClass(css('padding'))
                    .append($('<div>').addClass(css('angle')))
                    .append($('<div>').addClass(css('head'))
                        .append($('<div>').addClass(css('close')).html('&times;'))
                        .append($('<div>').addClass(css('month')))
                        .append($('<div>').addClass(css('week')))
                    )
                    .append($('<div>').addClass(css('bodywrap')).append($('<div>').addClass(css('body'))))
                )

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
            monthHeights[0] = [0, day.getMonth(), day.getFullYear()];
            var monthHeight =0;
            while (day < dayLast) {
                var $w = $('<div>').addClass(css('row'));
                for (var i=0; i<7; i++) {
                    var $day = $('<div>').html(day.getDate())
                    $day.addClass(css('date-'+dateToString(day)));
                    if (day.getDate() == 1) {
                        $day.prepend($('<div>').addClass(css('split')).html(getShortMonth(day)))
                        monthHeights[ monthHeights.length ] = [monthHeight, day.getMonth(), day.getFullYear()];
                    }
                    var weekday = day.getDay();
                    if (!settings.languagePackage.startsSunday) weekday = (weekday+6)%7;
                    if ((day < settings.anchorDate) ||
                        (settings.disabledDays.indexOf(weekday) >= 0) || 
                        (settings.disabledDates.indexOf(dateToString(day)) >= 0))
                        $day.addClass(css('disabled'));
                    $w.append($day);
                    day.setDate(day.getDate()+1);
                }
                monthHeight += rowHeight;
                $w.append($('<br clear="all">'))
                $body.append($w);
            }
            $body.css({ 'max-height' : settings.rows*rowHeight -1 })
            $calendar.hide();
            $calendar.appendTo($('body'));
            $curtain = $('<div>').addClass(css('curtain')).appendTo($('body'));
            view_bind();
        }

        function view_updateMonth() {
            var scroll = $calendar.find(dotcss('body')).scrollTop();
            var i;
            for (i=0; i<monthHeights.length; i++) {
                if (scroll < monthHeights[i][0]) break;
            }
            var month = monthHeights[i-1];
            $calendar.find(dotcss('month')).html(
                settings.languagePackage.months[monthHeights[i-1][1]] + " " + monthHeights[i-1][2]
            )
        }

        function view_updateDate(d) {
            view_removeDate();
            $calendar.find(dotcss('date-'+dateToString(d))).addClass(css('selected'))
        }
        function view_removeDate() {
            $calendar.find(dotcss('selected')).removeClass(css('selected'));            
        }

        function view_updateScroll() {
            var scrollTop = 0;
            $calendar.find(dotcss('body')).scrollTop(0)
            $calendar.find(dotcss('selected')).each(function(){
                scrollTop = $(this).position().top - settings.prevWeeks*rowHeight;
            })
            $calendar.find(dotcss('body')).scrollTop(scrollTop)
        }

        function view_close() {
            view_hideCurtain()
            if ($calendar) $calendar.hide();
        }
        function _pct(value, target) {
            if (typeof value === 'string' && value.match(/^[0-9]+%$/))
                return target*parseFloat(value.replace(/%/, ''))/100;
            return value;
        }
        function view_open($input) {
            if ($input) {
                var offsetLeftRel = _pct(settings.offset.left,  $input.width());
                var offsetTopRel  = _pct(settings.offset.top,   $input.height());
                var offsetShift   = _pct(settings.offset.shift, $calendar.height());
                
                var offset = $input.offset();
                offset.top  += offsetTopRel;
                offset.left += offsetLeftRel;
                offset.right = 'auto';

                // shift up
                var shift = $(window).height() + $(document).scrollTop() - offset.top - $calendar.height() 
                        -25; // top up a little to show border
                if (shift > -offsetShift) shift = -offsetShift;
                console.log(shift)
                if (offset.top - $(document).scrollTop() + shift < 0) 
                        shift = $(document).scrollTop() - offset.top 
                                +10; // shift down a bit to show border
                offset['margin-top'] = shift;

                // shift right
                var shiftLeft = $(window).width() - offset.left - $calendar.width();
                if (shiftLeft < 0) {
                    offset.left = 'auto';
                    offset.right = 10;
                }
                    
                // apply offsets
                $calendar.css(offset);
                $calendar.find(dotcss('angle')).css({'margin-top':-shift-20})
                // Let us make sure angle is pointed into <input>
                if ((-shiftLeft > offsetLeftRel - 20) || (shift > -15) || (shift < -$calendar.height()))
                    $calendar.find(dotcss('angle')).hide();
                else
                    $calendar.find(dotcss('angle')).show(); 
            }
            $calendar.show();
            view_showCurtain()
            view_updateScroll();
            view_updateMonth();
        }

        var _overflow = false;
        function view_showCurtain() {
            if ($curtain) {
                $curtain.show();
                _overflow = $(document.body).css('overflow');
                $(document.body).css({ overflow: 'hidden' })
            }
        }
        function view_hideCurtain() {
            if ($curtain) {
                $curtain.hide();
                if (_overflow !== false)
                    $(document.body).css({ overflow: _overflow })
            }
        }

        function view_bind() {
            // Update month display on scroll
            var to_scroll;
            $calendar.find(dotcss('body')).scroll(function(){
                clearTimeout(to_scroll);
                to_scroll = setTimeout(view_updateMonth, 50);
            })

            // Select day on click 
            $calendar.find(dotcss('row')+" > div").click(function(event){
                controller_select(this);
                event.stopPropagation();
            })

            // Close by X
            $calendar.find(dotcss('close')).click(function(){
                controller_close();
            })

            // Close by click on curtain
            $curtain.click(function(event){ controller_close(); });
        }


        // =====================================================================================
        // =====================================================================================
        // CONTROLLERS (open, close, select)
        // =====================================================================================
        var $input = false;

        function controller_open(input) {
            view_prerender();
            controller_closeAll();
            $input = $(input);
            var date = new Date();
            var input_val = $(input).val();
            if (input_val.match(/^[0-9]{1,2}-[0-9]{1,2}-[0-9]{4}$/)) {
                date = dateFromString(input_val);
                view_updateDate(date);
            } else 
                view_removeDate();
            view_open($input);
            $input.focus();
        }
        function e_controller_open(input, event) {
            event.stopPropagation();
            if ($input && $input.is(input)) return false;
            controller_open(input);
        }

        function controller_select(day) {
            var $day = $(day);
            if (!$day.hasClass(css('disabled'))) {
                m = day.className.match(css('date-')+'([0-9]{2}-[0-9]{2}-[0-9]{4})');
                var dateResult = m[1];
                view_updateDate(dateFromString(dateResult))
                $input.val(dateResult);
                controller_close();
            }
        }

        function controller_close() {
            view_close();
            $input = false;
        }
        function controller_closeAll() {
            for (var i=0; i<close_registry.length; i++)
                close_registry[i]();            
        }
        close_registry[ close_registry.length ] = controller_close;

        // =====================================================================================
        // =====================================================================================
        // ACTION!
        // =====================================================================================
        if (settings.prerender) view_prerender();
        var isVisible = false
        return this.each(function() {
            $(this).click(function(event){ e_controller_open(this, event) })
                   .focus(function(event){ var that = this; setTimeout(function(){ e_controller_open(that, event) }, 100) })
                   .blur (function(event){ setTimeout(controller_close, 100) })

            if (settings.visible && !isVisible) {
                isVisible = true;
                controller_open(this);
            }
        });

    };
}( jQuery ));