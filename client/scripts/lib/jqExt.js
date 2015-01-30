
/*!
 * jQuery UI Counter 1.11.2
 * http://jqueryui.com
 *
 * Built by dschwarz off the counter widget
 *
 * Makes an input that accepts numbers, max and min values, and can be incremented/decremented
 */


function counter_modifier( fn ) {
    return function() {
        var previous = this.element.val();
        fn.apply( this, arguments );
        this._refresh();
        if ( previous !== this.element.val() ) {
            this._trigger( "change" );
        }
    };
}


var counter = $.widget( "ui.counter", {
    version: "1.11.2",
    defaultElement: "<input>",
    widgetEventPrefix: "count",
    options: {
        icons: {
            down: "ui-icon-triangle-1-s",
            up: "ui-icon-triangle-1-n"
        },
        max: null,
        min: null,

        change: null
    },

    _create: function() {
        // handle string values that need to be parsed
        this._setOption( "max", this.options.max );
        this._setOption( "min", this.options.min );

        // Only format if there is a value, prevents the field from being marked
        // as invalid in Firefox, see #9573.
        if ( this.value() !== "" ) {
            // Format the value, but don't constrain.
            this._value( this.element.val(), true );
        }

        this._draw();
        this._on( this._events );
        this._refresh();
    },

    _getCreateOptions: function() {
        var options = {},
            element = this.element;

        $.each( [ "min", "max" ], function( i, option ) {
            var value = element.attr( option );
            if ( value !== undefined && value.length ) {
                options[ option ] = value;
            }
        });

        return options;
    },

    _events: {
        keydown: function( event ) {
            if ( this._keydown( event ) ) {
                event.preventDefault();
            }
        },
        focus: function() {
            this.previous = this.element.val();
        },
        blur: function( event ) {
            this.value(this._adjustValue(this.element.val()));
            this._refresh();
            if ( this.previous !== this.element.val() ) {
                this._trigger( "change", event );
            }
        },
        "mousedown .ui-counter-button": function( event ) {
            $( event.currentTarget ).hasClass( "ui-counter-up" ) ? this.increment() : this.decrement();
			event.preventDefault();
            this._trigger( "change", event );
        }
    },

    _draw: function() {
        var uiCounter = this.uiCounter = this.element
            .addClass( "ui-counter-input" )
            .attr( "autocomplete", "off" )
            .css( "width", "25px" )
            .css( "height", "100%" )
            .wrap( this._uiCounterHtml() )
            .parent()
                // add buttons
                .prepend( this._downButtonHtml() )
                .append( this._upButtonHtml() );

        // button bindings
        this.buttons = uiCounter.find( ".ui-counter-button" )
            .attr( "tabIndex", -1 )
            .button()
            .removeClass( "ui-corner-all" );

        // IE 6 doesn't understand height: 50% for the buttons
        // unless the wrapper has an explicit height
        if ( this.buttons.height() > Math.ceil( uiCounter.height() * 0.5 ) &&
                uiCounter.height() > 0 ) {
            uiCounter.height( uiCounter.height() );
        }

        // disable counter if element was already disabled
        if ( this.options.disabled ) {
            this.disable();
        }
    },

    _keydown: function( event ) {
        var keyCode = $.ui.keyCode;

        switch ( event.keyCode ) {
        case keyCode.UP:
            this.increment();
            return true;
        case keyCode.DOWN:
            this.decrement();
            return true;
        case keyCode.ESCAPE:
            this.value(this.previous);
        }

        return false;
    },

    _uiCounterHtml: function() {
        return "<div style='white-space: nowrap;'></div>";
    },

	_upButtonHtml: function() {
		return "" +
			"<a class='ui-counter-button ui-counter-up ui-corner-tr'>" +
				"<span class='ui-icon " + this.options.icons.up + "'>&#9650;</span>" +
			"</a>";
	},

	_downButtonHtml: function() {
		return "" +
			"<a class='ui-counter-button ui-counter-down ui-corner-br'>" +
				"<span class='ui-icon " + this.options.icons.down + "'>&#9660;</span>" +
			"</a>";
	},

    _adjustValue: function( value ) {
        var options = this.options;

        value = Math.floor(value);

        var max = $.isFunction(options.max) ? options.max() : options.max;
        var min = $.isFunction(options.min) ? options.min() : options.min;

        // clamp the value
        if ( max !== null && value > max) {
            return max;
        }
        if ( min !== null && value < min ) {
            return min;
        }

        return value;
    },

    _setOption: function( key, value ) {
        if ( key === "max" || key === "min" || key === "step" ) {
            if ( typeof value === "string" ) {
                value = this._parse( value );
            }
        }
        if ( key === "icons" ) {
            this.buttons.first().find( ".ui-icon" )
                .removeClass( this.options.icons.up )
                .addClass( value.up );
            this.buttons.last().find( ".ui-icon" )
                .removeClass( this.options.icons.down )
                .addClass( value.down );
        }

        this._super( key, value );

        if ( key === "disabled" ) {
            this.widget().toggleClass( "ui-state-disabled", !!value );
            this.element.prop( "disabled", !!value );
            this.buttons.button( value ? "disable" : "enable" );
        }
    },

    _setOptions: counter_modifier(function( options ) {
        this._super( options );
    }),

    _refresh: function() {
        this.element.attr({
            "aria-valuemin": this.options.min,
            "aria-valuemax": this.options.max,
            "aria-valuenow": this._parse( this.element.val() )
        });
    },

    isValid: function() {
        var value = this.value();

        // null is invalid
        if ( value === null ) {
            return false;
        }

        // if value gets adjusted, it's invalid
        return value === this._adjustValue( value );
    },

    increment: function() {
        this.value(this.value() + 1);
        this._trigger( "increment");
    },

    decrement: function() {
        this.value(this.value() - 1);
        this._trigger( "decrement");
    },

    _parse: function( val ) {
        if ( typeof val === "string" && val !== "" ) {
            val = window.Globalize && this.options.numberFormat ?
                Globalize.parseFloat( val, 10, this.options.culture ) : +val;
        }
        return val === "" || isNaN( val ) ? this.previous : val;
    },

    // update the value without triggering change
    _value: function( value, allowAny ) {
        if ( value !== "" ) {
            value = this._parse( value );
            if ( value !== null ) {
                if ( !allowAny ) {
                    value = this._adjustValue( value );
                }
            }
        }
        this.element.val( value );
        this._refresh();
    },

    _destroy: function() {
        this.element
            .removeClass( "ui-counter-input" )
            .prop( "disabled", false )
            .removeAttr( "autocomplete" )
            .removeAttr( "role" )
            .removeAttr( "aria-valuemin" )
            .removeAttr( "aria-valuemax" )
            .removeAttr( "aria-valuenow" );
        this.uiCounter.replaceWith( this.element );
    },

    value: function(newVal) {
        if (!arguments.length) {
			return this._parse( this.element.val() );
        }
        counter_modifier( this._value ).call( this, newVal );
    },

    widget: function() {
        return this.uiCounter;
    }
});