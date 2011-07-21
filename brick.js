/***
 * CompJS: created by Artur Rivilis
 ***/

/**
 * Dependency: class system. created By John Resig.
 */
(function($) {
	var initializing = false, fnTest = /xyz/.test(function() {
		xyz;
	}) ? /\b_super\b/ : /.*/;

	this.Class = function(e) {
	}

	Class.extend = function(prop) {
		var _super = this.prototype;

		initializing = true;
		var prototype = new this(prop);
		initializing = false;

		for ( var name in prop) {
			prototype[name] = typeof prop[name] == "function"
					&& typeof _super[name] == "function"
					&& fnTest.test(prop[name]) ? (function(name, fn) {
				return function() {
					var tmp = this._super;
					this._super = _super[name];
					var ret = fn.apply(this, arguments);
					this._super = tmp;
					return ret;
				};
			})(name, prop[name]) : prop[name];
		}

		// The dummy class constructor
		function Class(e) {
			if (!initializing) 
				if (this.init)
					this.init.apply(this, arguments);
		}

		Class.prototype = prototype;
		Class.constructor = Class;
		Class.extend = arguments.callee;
		return Class;
	};
})(jQuery);

(function($) {
	/**
	 * jQuery plugin for DOM element -> Component Object bindings. All DOM
	 * elements that are annotated with 'comp' will be picked up and
	 * initialized. You can query for the bound object using compobj plugin.
	 */
	$.fn.comp = function() {
		return $("[data-comp]", this).each(function() {
			var self = this;
			$.each($(this).attr("data-comp").split(","), function(key, value) {
				var value = $.trim(value);
				if (Comp[value] && !$(self).compobj(value)) {
					$(self).compobj(value, new Comp[value](self));
				}
			});
		});
	}

	/**
	 * jQuery plugin that sets/returns the component that is associated with a
	 * particular DOM element.
	 * 
	 * @returns (Comp) object bound to DOM element.
	 */
	$.fn.compobj = function(value, obj) {
		if (obj)
			$(this).data("$Comp." + value, obj);
		else
			return $(this).data("$Comp." + value);
	}

	/**
	 * jQuery plugin that will find sub-components inside of a DOM element that
	 * is bound to a Component Object.
	 * 
	 * @returns (Array) of DOM elements
	 */
	$.fn.compfind = function(/* String */str) {
		if (str == null) {
			return $(this).find("[data-sub]");
		} else {
			return $(this).find("[data-sub='" + (str.charAt(0) == '$' ? str.substring(1) : str) + "']");
		}
	}

	/**
	 * Introspective function, which will look at the method passed in and do
	 * two things:
	 * 
	 * 1. Map $sub_name to the corresponding DOM elements. 2. Take the method fn
	 * and call it with me.
	 * 
	 * @see Comp#init
	 * @param (Function) fn to be wrapped
	 * @param (Comp) me inherited-object instance to call 'fn' with.
	 * @returns (Function) which will auto-bind $ variables.
	 */
	$.paramBinder = function(/* Function */fn, /* Object */me) {

		/**
		 * From Prototype JS
		 */
		function argumentNames( /* Function */fn) {
			var names = fn.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
					.replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
					.replace(/\s+/g, '').split(',');
			return names.length == 1 && !names[0] ? [] : names;
		}

		/**
		 * Return a closure that closes on function and me references. We
		 * optimize to only do this process once.
		 */

		return function() {

			var ref = this;
			var original = [], newones = [];
			var names = argumentNames(fn);

			for ( var i = 0; i < arguments.length; i++) {
				original.push(arguments[i]);
			}

			/**
			 * Copy from the original to the new one. This will preserve the
			 * argument order.
			 */
			$.each(names, function(index, key) {
				if (key == "$this") {
					newones.push($(ref));
				} else if (key.charAt(0) == "$") {
					newones.push(me.element.compfind(key));
				} else {
					newones.push(original.shift());
				}
			});

			return fn.apply(me, newones);
		}
	}
})(jQuery);

(function($) {

	
	/**
	 * A safer cross browser way of getting the prototype of an object
	 * this is used below in get method.
	 */
	if (typeof Object.getPrototypeOf !== "function") {
		if (typeof "test".__proto__ === "object") {
			Object.getPrototypeOf = function(object) {
				return object.__proto__;
			};
		} else {
			Object.getPrototypeOf = function(object) {
				// May break if the constructor has been tampered with
				return object.constructor.prototype;
			};
		}
	}

	/**
	 * Private method that accepts an object prototype and then recursively
	 * assimilates all the method that are defined by the prototype.
	 * 
	 * @param (Object)
	 *            returns hash of method names -> method mappings.
	 */
	function getMethods(/* Object [prototype] */proto) {

		var methods = {};

		if (proto == null)
			return {};

		for ( var name in proto )
			if ($.isFunction(proto[name]))
				methods[name] = proto[name];

		return $.extend(methods, arguments.callee(Object.getPrototypeOf(proto)));
		
	}

	/**
	 * The Component abstract base class. Extend this class to provide a class
	 * with auto-binding of 'sub' annotated child elements, this.element binding
	 * and event binding.
	 * 
	 * @returns (Comp) object, which implements extend, and special #init
	 *          method.
	 * @base Class
	 */
	this.Comp = Class.extend({
				init : function( /* DOMElement */e) {

					/**
					 * Gather all the methods using introspection borrowed from
					 * Prototype.js. Bind this.element to the element in
					 * question.
					 */
					var methods = getMethods(this);
					this.element = $(e);

					/**
					 * Get the data-attributes, which will populate the
					 * configuration for this element.
					 * 
					 * To access DOM attribute use this._attr.{name} instead of
					 * this.element.attr("data-{name}")
					 */
					this._attr = {}
					for ( var i = 0, attrs = e.attributes, len = attrs.length; i < len; i++) {
						var name = attrs.item(i).nodeName;
						var postfix = name.replace(/data-/, "");

						if (postfix !== name)
							this._attr[postfix] = attrs.item(i).nodeValue;
					}

					/**
					 * Iterate through the object properties. Check to make sure
					 * that they are actual methods before proceeding, since we
					 * are only binding functions. Also make sure we have no
					 * initializers or supers.
					 */

					for ( var method in methods) {

						if (method != "_super" && method != "init") {

							/**
							 * Bind the method to be used many times below.
							 */
							var boundMethod = $.paramBinder(this[method], this);

							/**
							 * Event Handler of type $[subname]_[event]
							 */

							if (/_/.test(method)) {
								var keys = method.split("_");
								var fn = keys.pop();
								var name = keys.pop();

								if ("$" == name) {
									this.element.bind(fn, boundMethod);
								} else {
									this.element.compfind(name).live(fn, boundMethod);
								}

							} else {

								/**
								 * Event Handler of type "[css accessor]
								 * [event]". an example of this would be "li
								 * click": function($foo) { } to bind a click to
								 * all LI elements. Helpful if you don't want to
								 * 'sub' iterated elements.
								 */

								if (/\s/.test(method)) {

									var tokens = method.split(" ");
									var fn = tokens.pop();

									this.element.find(tokens.join(" ")).live(
											fn, boundMethod);

								} else {

									/**
									 * Looks like it's not a *event handler*,
									 * but it's still a method in the class so
									 * let's just bind it.
									 */

									this[method] = boundMethod;
								}

							}
						}
					}
				}
			});

	this.Comp.namespace = function(/* String */name, /* Object */obj) {
		if (Comp[name] === undefined) 
			Comp[name] = {};
		
		$.each(obj, function(e) {
			Comp[name + "." + e] = obj[e];
			(Comp[name])[e] = obj[e];
		});
	}

	$(function() {
		$(this).comp();
	});
})(jQuery);