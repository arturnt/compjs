
/*** 
 * Simple JavaScript Inheritance, dependency for framework below.
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
(function($){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  // The base Class implementation (does nothing)
  this.Class = function(e){}
  
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
    
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this(prop);
    initializing = false;
    
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" && 
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
            
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
            
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            //this.init = $.paramBinder(this.init, this);
            this._super = tmp;
            
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Class(e) {
      	if ( !initializing ) {
			if(this.init)
				this.init.apply(this, arguments);
		}
    }
    
    // Populate our constructed prototype object
    Class.prototype = prototype;
    
    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
    
    return Class;
  };
})(jQuery);


(function($) {	
	/**
	 * jQuery plugin for DOM element -> Component Object bindings.
	 * All DOM elements that are annotated with 'comp' will be picked
	 * up and initialized. You can query for the bound object using
	 * compobj plugin.
	 */
	$.fn.comp = function() {
		return this.each(function() {
			//console.log("[start] initializing: " + $(this).attr("comp"));
			if(Comp[$(this).attr("comp")]) 
				$(this).data("comp", new Comp[$(this).attr("comp")](this));
			
			//console.log("[end] initializing: " + $(this).attr("comp"));
		});
	}
	
	/**
	 * jQuery plugin that returns the component that is associated
	 * with a particular DOM element.
	 * @returns (Comp) object bound to DOM element.
	 */
	$.fn.compobj = function() {
		return $(this).data("comp");
	}

	/**
	 * jQuery plugin that will find sub-components inside of a DOM element
	 * that is bound to a Component Object.
	 * @returns (Array) of DOM elements
	 */
	$.fn.compfind = function(str) {
		if(str == null) {
			return $(this).find("[sub]"); 
		} else {
			return $(this).find("[sub='" + (str.charAt(0) == '$' ? str.substring(1) : str) + "']");
		}
	}
	
	/**
	 * Introspective function, which will look at the method passed in
	 * and do two things:
	 * 
	 * 	1. Map $sub_name to the corresponding DOM elements.
	 * 	2. Take the method fn and call it with me. 
 	 * 
 	 * @see Comp#init 
 	 * @param (Function) fn to be wrapped
 	 * @param (Comp) me inherited-object instance to call 'fn' with.
 	 * @returns (Function) which will auto-bind $ variables.
	 */
	$.paramBinder = function(fn, me) {
		function argumentNames(fn) {
			var names = fn.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
			  .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
			  .replace(/\s+/g, '').split(',');
			return names.length == 1 && !names[0] ? [] : names;
	  	}
		
		return function() {
			var names = argumentNames(fn);
			var original = [];
			var newones = [];
			
			for(var i = 0; i < arguments.length; i++) {
				original.push(arguments[i]);
			}
			
			// Copy from the original to the new one. Will preserve argument order.
			$.each(names, function(index,key) {
				if(key.charAt(0) == "$") {
					newones.push(me.element.compfind(key));
				} else {
					newones.push(original.shift());
				}
			});
			
			return fn.apply(me, newones);
		}
	}
})(jQuery);

(function($){
	
	/**
	 * Private method that accepts an object prototype and then recursively
	 * assimilates all the method that are defined by the prototype.
	 * @param (Object) returns hash of method names -> method mappings.
	 */
	function getMethods(proto) {
		if(proto == null) return {};
		var methods = {};
		
		for(var m in proto) {
			methods[m] = proto[m];
		}
	
		return jQuery.extend(methods, getMethods(proto.__proto__));
	}
	
	/**
	 * The Component abstract base class. Extend this class to provide a
	 * class with auto-binding of 'sub' annotated child elements,
	 * this.element binding and event binding. 
	 * @returns (Comp) object, which implements extend, and special #init method.
	 * @base Class 
	 */
	this.Comp = Class.extend({
		init: function(e, foo) {
			var methods = getMethods(this);
			this.element = $(e);

			for(var method in methods) {
				if(method != "_super" && method != "init") {
					if(/_/.test(method)) {
						var keys = method.split("_");
						var fn = keys[1];
	
						if(this.element[fn]) {
							var elements = ("$" == keys[0] ? this.element : this.element.compfind(keys[0]));
							elements.live(fn, $.paramBinder(this[method], this) );
							this[keys[0]] = elements; //bind element to 'this'
						} else {
							throw "Can't map " + fn + " because it doesn't exist in $.fn.";
						}
					} else {
						this[method] = $.paramBinder(this[method], this);
					}
				}
			}
		}
	});
})(jQuery);
