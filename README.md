# Marionette Forms

Trying to easy the form creation and maintainability of forms inside a Marionette view. 


## Copyright

Initially, this project was copied from Ampersand form related projects.
It was adapted to work with Marionette. Below are the references this code is based on.

* https://github.com/AmpersandJS/ampersand-form-view
* https://github.com/AmpersandJS/ampersand-input-view
* https://github.com/AmpersandJS/ampersand-select-view
* https://github.com/AmpersandJS/ampersand-array-input-view
* https://github.com/AmpersandJS/ampersand-checkbox-view


## Field requirements

That form can be given an array of field views.

These fields are also Marionette views, but just follow a few more conventions in order to be able to work with form view.

Those rules are as follows:

- It has to be an instance of `Marionette.View`, because the fields are rendered inside a Marionette Region.
- It has a `getValue()` function that returns the current value of the field.
- It has a `setValue()` function that sets the current value of the field.
- It should also store a `value` property if passed in as part of the config/options object when the view is created.
- It has a `isValid()` function that returns a boolean. The parent form checks this to know whether it can submit the form or not.
- It has a `getName()` function that returns the name of the field.
- It reports changes to its parent when it deems appropriate by calling `this.parent.update(this)` **note that it passes itsef to the parent. You would typically do this when the `this.value` has changed or the `this.valid` has changed.
- When rendered by a form-view, the form view creates a `parent` property that is a reference to the containing form view.
- It can optionally also define a `beforeSubmit` method. This gets called by the parent if it exists. This can be useful for stuff like a required text input that you don't want to show an error for if empty until the user tries to submit the form.
 

