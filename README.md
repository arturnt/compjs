##BrickJS

Object Oriented Component Model for jQuery for writing consice yet powerful
javascript components.

###Summary

BrickJS is provided as a building block for javascript components. There are
various problems that it tries to address that are existent in current uses of
javascript on the web:

1. Inline or bottom fo the page javascript scattered all over the document.
2. Non-reusable components, lacking any sort of inheritence. Lots of copy 
and paste.
3. Functional development of UI components. A lot of functioality is baked
into a few functions instead of relying on the natural object nature of UI.
4. No clear separation of concerns. Heavy dependence on DOM with no consistent
models. Some use classes some use IDs. Any change to the DOM breaks components.

BrickJS solves these problems in the following way:

1. The components are bound via attributes, only one line needed to bind
all the components on the page.
2. The framework relies on John Resig's inheritence model while adding removing
the need for boilerplate code associated with classes. This provides the beauty
of inheritence that comes with OOP.
3. The framework has a very loose coupling to the DOM. All relations are 
attribute drivens o the design can evolve independently of the functionality.

###Examples

Best way to explain is with some examples. Let's start off with Tabs; one of
the more commonly used components. 

```html
<div comp="TabsInline">
	<ul>
		<li sub="tab" text="Buz" href="/ajax/content1">
		<li sub="tab" text="Bar" href="/ajax/content2">
		<li sub="tab" text="Foo" href="/ajax/content3">
	</ul>
	<div sub="panel"></div>
</div>
```
```html
<script>
	Comp.TabsInline = this.extend({
		$tab_click: function(e, $panel, $tab) {
			$tab.removeClass("selected");
			this.pick($panel, $(e.target).addClass("selected"));
		},
		pick: function(panel, target) {
			panel.text(target.attr("text"));
		}
	});

	$("[comp]").comp();
</script>
```

Here are some very basic Inline Tabs. The DOM elements identified as "tab" 
are automatically bound to a click method. You can then also pass them into
any function in the class, and they will also automatically be 
bound( $tab -> $("[sub='tab']") ). 'this' is pointing to the class instance,
without any proxying sillyness.

Now let's make these tabs load content dynamically:

```html
<script>
	Comp.TabsAjax = Comp.TabsInline.extend({
		pick: function(panel, target) {		
			panel.load(target.attr("src"));
		}
	});
</script>
```

Now if we replace TabsInline with TabsAjax in the markup we have Ajax Tabs.
Due to the inheritence model, we don't have to write most of the functionality
just write what happens when a tab is chosen. 

This is just to get you started, using these simple building blocks you can write
fairly complicated functionality in clean and simple code. Enjoy!

### License

The MIT License (MIT)
Copyright (c) 2011 Artur Rivilis

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.