# simplecalendar
This is a simplecalendar test case.
Work is in progress.

## jQuery Plugin Approach
I choose to implement calendar as a jQuery plugin in order to follow jQuery extension guidelines; this approach allows various ways to install calendar and removes the need to customize labels/inputs via configuration objects.

However, it is possible to create shorthands that would generate such labels/inputs. 

## Calendar as a singleton
I choose to go with singleton-style approach to calendar behavior. It is not possible to show more than one calendar pop-up at the time: I consider this behavior to be clear and intuitive for the user; multiple pop-ups might clatter the screen.

## Styling
I choose to put all styles in simplecalendar.css file, because such an approach will allow better customization of visual style and subtle animation behavior.

The CSS is not minimized because it would be better to glue it with other style files and to minimize/obfucate them using Grunt or other automation.

Another way to ged rid of CSS is to hardcode it into javascript library. I consider this path to be inefficient in terms of support and future re-use.