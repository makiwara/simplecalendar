# simplecalendar
This is a simplecalendar test case.
Demonstration: http://humanemagica.com/portfolio/simplecalendar/

Notes below intended to explain certain crucial design choices I have made.

## jQuery Plugin Approach
I choose to implement calendar as a jQuery plugin in order to follow jQuery extension guidelines; this approach allows various ways to install calendar and removes the need to customize labels/inputs via configuration objects.

However, it is possible to create shorthands that would generate such labels/inputs. 

## Calendar as a Singleton
I choose to go with singleton-style approach to calendar behavior. It is not possible to show more than one calendar pop-up at the time: I consider this behavior to be clear and intuitive for the user; multiple pop-ups might clatter the screen.

## Curtain
I took the liberty to implement 0.25-black curtain to help user to focus on
the calendar pop-up. By same reason document.body scroll is disabled while pop-up is visible: such tactic allows user to focus on date selection.

If this approach does not sound valid, the plugin could be refactored easily by just removing $curtain initialization code.

## Styling
I choose to put all styles in simplecalendar.css file, because such an approach will allow better customization of visual style and subtle animation behavior.

The CSS is not minimized because it would be better to glue it with other style files and to minimize/obfucate them using Grunt or other automation.

Another way to get rid of CSS is to hardcode it into javascript library. I consider this path to be inefficient in terms of support and future re-use.

It was not possible to determine exact padding from the PDF, as well as font families and sizes; I took the liberty to use Arial as primary font-face and to adjust paddings, margins and sizes by myself.

## Browser support
The plugin was developed using Chrome. I have tested the plugin in Safari, Firefox, Opera and MSIE 8, 9, 10 so far; it worked perfectly with almost no patches required. 

I have used PIE (http://css3pie.com/) to provide box-shadow for the calendar pop-up in MSIE 8, because the latter does not support box-shadow property.