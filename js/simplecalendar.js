/*  *************************************************
    *                                               *
    *   Simplecalendar jQuery Plugin                *
    *   http://github.com/makiwara/simplecalendar   * 
    *                                               *
    ************************************************* */
(function($) {

    // The code is split into following parts:
    // 1) settings and defaults — this is where defaults are introduced and modified
    // 2) utility — functions to help with common operations such as date transformation and className generation
    // 3) views — functions that operate with visual appearance of calendar pop-up and enclosed events
    // 4) controller — functions that provide interoperability with <input>
    // 5) init — iterator to bind controller functions to <inputs> provided by jQuery plugin infrastructure
 
    $.fn.simplecalendar = function(options) {
        var $calendar = false; 
        var $curtain  = false; 

        // =====================================================================================
        // =====================================================================================
        // Settings and defaults
        // =====================================================================================
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

        // Actualize anchorDate, today if missing
        if (settings.anchorDate === false) settings.anchorDate = new Date();
        if (typeof settings.anchorDate == 'string') settings.anchorDate = dateFromString(settings.anchorDate);

        // Convert disableDates to string format
        for (var i=0; i<settings.disabledDates.length; i++) {
            if (typeof settings.disabledDates[i] == 'date') 
                settings.disabledDates[i] = dateToString(settings.disabledDates[i]);
        }

        // Fix disabledDays and weekdays order to support i18n startsSunday
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
        // UTILITY: short functions with obvious purposes
        // =====================================================================================
        
        function css(suffix) { return settings.cssPrefix+'-'+suffix }
        function dotcss(suffix) { return '.'+css(suffix) }
        function dateFromString(s) { // 'dd-mm-yyyy' -> new Date(...)
            s = s.split('-');
            return new Date(parseInt(s[2], 10), parseInt(s[1], 10)-1, parseInt(s[0], 10));
        }
        function rjust(s, width, padding) { // ('1',4,'0') -> '0001'
            s = String(s);
            padding = padding || "0";
            padding = padding.substr(0,1)
            if( s.length < width )
                for( var i = 0, buf = ""; i < width - s.length ; i++ ) 
                    s = padding + s;
            return s;
        }
        function dateToString(d) { // new Date() -> 'dd-mm-yyyy'
            return [rjust(d.getDate(),2), rjust(d.getMonth()+1,2), d.getFullYear()].join("-");
        }
        function findDay0(date, shiftLeft) { // returns Monday shifted by X days in past from date
            var offset = date.getDay();
            if (!settings.languagePackage.startsSunday) offset = (offset+6)%7;
            var d = new Date(date)
            d.setDate(date.getDate()-offset-shiftLeft);
            return d;
        }
        function findDayLast(date, shiftRight) { // returns Monday shifted by X days in future from date
            return findDay0(date, 7-shiftRight);
        }
        function getShortMonth(date) { // new Date() -> 'M O N' (three capitalized letters of month)
            var month = settings.languagePackage.months[date.getMonth()].toUpperCase().substr(0,3);
            return [month.charAt(0), month.charAt(1), month.charAt(2)].join(" ");
        }
        
        // =====================================================================================
        // =====================================================================================
        // VIEW: functions to render HTML and to serve enclosed events
        // =====================================================================================
        var rowHeight = false; // to be computed on view_open()
        var monthHeights = []; // filled with [row_number, m, y] for each month in calendar

        /***************************************************************************************
         * Builds pop-up & curtain HTML via jQuery object;
         */
        function view_prerender() {
            if ($calendar !== false) return; // skip if $calendar already in place

            // build pop-up skeleton
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
                );

            // build weekday title [Mo...Su]
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
            //
            while (day < dayLast) {
                var $w = $('<div>').addClass(css('row'));

                // build each day in the week
                for (var i=0; i<7; i++) {
                    var $day = $('<div>').html(day.getDate())
                    $day.addClass(css('date-'+dateToString(day))); // 'simplecalendar-date-dd-mm-yyyy'

                    // insert month split and store row number to use in view_updateScroll()
                    if (day.getDate() == 1) {
                        $day.prepend($('<div>').addClass(css('split')).html(getShortMonth(day)))
                        monthHeights[ monthHeights.length ] = [monthHeight, day.getMonth(), day.getFullYear()];
                    }

                    // disable day if it is a holiday or a weekend day
                    var weekday = day.getDay();
                    if (!settings.languagePackage.startsSunday) weekday = (weekday+6)%7;
                    if ((day < settings.anchorDate) ||
                        (settings.disabledDays.indexOf(weekday) >= 0) || 
                        (settings.disabledDates.indexOf(dateToString(day)) >= 0))
                        $day.addClass(css('disabled'));

                    // push day into week
                    $w.append($day);
                    day.setDate(day.getDate()+1);
                }
                // finalize week row
                $w.append($('<br clear="all">'))
                $body.append($w);
                monthHeight ++;
            }
            // insert hidden calendar and curtain in DOM and bind events
            $curtain = $('<div>').addClass(css('curtain')).appendTo($('body'));
            $calendar.appendTo($('body'));
            view_bind();

            // update rowHeight and dependants
            $calendar.find(dotcss('row')).first().each(function(){ rowHeight = $(this).height() });
            $calendar.find(dotcss('body')).css({ 'max-height' : settings.rows*rowHeight -1 });
            $calendar.hide();

        }

        /***************************************************************************************
         * Updates title 'DECEMBER 2015' according to first month visible
         */
        function view_updateMonth() {
            // detect first visible month row
            var scroll = $calendar.find(dotcss('body')).scrollTop();
            var i;
            for (i=0; i<monthHeights.length; i++) {
                if (scroll < monthHeights[i][0]*rowHeight) break;
            }
            // update month title
            $calendar.find(dotcss('month')).html(
                settings.languagePackage.months[monthHeights[i-1][1]] + " " + monthHeights[i-1][2]
            )
        }

        /***************************************************************************************
         * Two routines to highlight selected date and to remove highlight
         */
        function view_updateDate(d) {
            view_removeDate();
            $calendar.find(dotcss('date-'+dateToString(d))).addClass(css('selected'))
        }
        function view_removeDate() {
            $calendar.find(dotcss('selected')).removeClass(css('selected'));            
        }

        /***************************************************************************************
         * Updates scroll position to ensure selected date is highly visible 
         */
        function view_updateScroll() {
            var scrollTop = 0;
            $calendar.find(dotcss('body')).scrollTop(0); 
            $calendar.find(dotcss('selected')).each(function(){
                scrollTop = $(this).position().top - settings.prevWeeks*rowHeight;
            })
            $calendar.find(dotcss('body')).scrollTop(scrollTop)
        }

        /***************************************************************************************
         * Converts '50%' value into pixels using <target> as 100%.
         * If value is a number, just return that number.
         */
        function _pct(value, target) {
            if (typeof value === 'string' && value.match(/^[0-9]+%$/))
                return target*parseFloat(value.replace(/%/, ''))/100;
            return value;
        }
        /***************************************************************************************
         * Repositions calendar pop-up to <input> and makes it visible
         */        
        function view_open($input) {
            if ($input) {

                // calculate offsets from settings ('50%' -> pixels)
                var offsetLeftRel = _pct(settings.offset.left,  $input.width());
                var offsetTopRel  = _pct(settings.offset.top,   $input.height());
                var offsetShift   = _pct(settings.offset.shift, $calendar.height());
                
                // get initial offset of the popup
                var offset = $input.offset();
                offset.top  += offsetTopRel;
                offset.left += offsetLeftRel;
                offset.right = 'auto';

                // shift vertically to ensure it is visible
                var shift = $(window).height() + $(document).scrollTop() - offset.top - $calendar.height() 
                        -25; // top up a little to show border
                if (shift > -offsetShift) shift = -offsetShift;
                if (offset.top - $(document).scrollTop() + shift < 0) 
                        shift = $(document).scrollTop() - offset.top 
                                +10; // shift down a bit to show border
                offset['margin-top'] = shift;

                // shift horizontally
                var shiftLeft = $(window).width() - offset.left - $calendar.width();
                if (shiftLeft < 0) {
                    offset.left = 'auto';
                    offset.right = 10;
                }
                    
                // apply offsets to calendar and to CSS triangle 
                $calendar.css(offset);
                $calendar.find(dotcss('angle')).css({'margin-top':-shift-20})

                // make sure angle is pointed into <input>, hide it if it is not
                if ((-shiftLeft > offsetLeftRel - 20) || (shift > -15) || (shift < -$calendar.height()+15))
                    $calendar.find(dotcss('angle')).hide();
                else
                    $calendar.find(dotcss('angle')).show(); 
            }

            // show calendar and curtain
            $calendar.show();
            view_showCurtain();

            // update scroll position and month title
            view_updateScroll();
            view_updateMonth();
        }
        /***************************************************************************************
         * Hides calendar pop-up and curtain
         */
        function view_close() {
            view_hideCurtain();
            if ($calendar) $calendar.hide();
        }

        /***************************************************************************************
         * Curtain control routines, work only if $curtain is ready.
         */
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

        /***************************************************************************************
         * Binds events which are fired from inside the calendar pop-up and curtain
         */
        function view_bind() {

            // update month display on scroll; aggregate events in 50ms timeout
            var to_scroll;
            $calendar.find(dotcss('body')).scroll(function(){
                clearTimeout(to_scroll);
                to_scroll = setTimeout(view_updateMonth, 50);
            })

            // select day on click 
            $calendar.find(dotcss('row')+" > div").click(function(event){
                controller_select(this);
                event.stopPropagation();
            })

            // close pop-up by X button
            $calendar.find(dotcss('close')).click(controller_close);

            // close pop-up by click on curtain or document
            if ($curtain)
                $curtain.click(controller_close);
            else
                $(document).click(controller_close);
        }


        // =====================================================================================
        // =====================================================================================
        // CONTROLLERS: function to operate with calendar entity
        // =====================================================================================
        var $input = false; // <input> associated with calendar pop-up opened

        /***************************************************************************************
         * Adjusts calendar to given <input> and opens it
         */
        function controller_open(input) {
            // prepare and got to state zero
            view_prerender();
            controller_closeAll();
            
            // update from <input> value if it is possible
            $input = $(input);
            var date = new Date();
            var input_val = $(input).val();
            if (input_val.match(/^[0-9]{1,2}-[0-9]{1,2}-[0-9]{4}$/)) {
                date = dateFromString(input_val);
                view_updateDate(date);
            } else 
                view_removeDate();

            // open pop-up but stay focused in <input> to support keyboard input such as tabulation
            view_open($input);
            $input.focus();
        }

        /***************************************************************************************
         * Event handler wrapper for controller_open()
         */
        function e_controller_open(input, event) {
            event.stopPropagation();
            if ($input && $input.is(input)) return false;
            controller_open(input);
        }

        /***************************************************************************************
         * Selects a day on click and updates <input> accordingly
         */
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

        /***************************************************************************************
         * Closes pop-up and unlinks from <input>
         */
        function controller_close() {
            view_close();
            $input = false;
        }
        close_registry[ close_registry.length ] = controller_close;

        /***************************************************************************************
         * Close all pop-ups from the registry to ensure singleton behavior
         */
        function controller_closeAll() {
            for (var i=0; i<close_registry.length; i++)
                close_registry[i]();            
        }


        // =====================================================================================
        // =====================================================================================
        // INIT: all steps required to prepare calendar for provided <input> hosts 
        // =====================================================================================

        if (settings.prerender) view_prerender();
        var isVisible = false;
        return this.filter('input').each(function() {
            // bind click, focus and blur events
            $(this).click(function(event){ e_controller_open(this, event) })
                   .focus(function(event){ var that = this; setTimeout(function(){ e_controller_open(that, event) }, 100) })
                   .blur (function(event){ setTimeout(controller_close, 100) })

            // open first calendar if required by options
            if (settings.visible && !isVisible) {
                isVisible = true;
                controller_open(this);
            }
        });
    };

    // Each $().simplecalendar spawns its own calendar with its own settings (language or size could differ)
    // To achieve singleton behavior close_registry is introduced. All controller_close() functions are stored
    // in the registry to be called from controller_closeAll().
    var close_registry = [];

}( jQuery ));