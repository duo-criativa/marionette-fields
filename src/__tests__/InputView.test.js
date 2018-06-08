var Mn = require('backbone.marionette');
var InputView = require('../InputView');
var FormView = require('../FormView');

describe('InputView', function() {

  describe('requirements', function() {

    it('It is instance of Mn.View', function() {
      var input = new InputView({});
      expect(input instanceof Mn.View).toBe(true);
    });

    it('It has a `getValue()` function that returns the current value of the field.',
        function() {
          var input = new InputView({name: 'last_name', value: 'Last name'});
          expect(input.getValue()).toBe('Last name');
        });

    it('It has a `setValue()` function that sets the current value of the field.',
        function() {
          var input = new InputView({name: 'last_name'});
          expect(input.getValue()).toBe('');
          input.setValue('Another name');
          expect(input.getValue()).toBe('Another name');
          input.render();
          expect(input.ui.input.val()).toBe('Another name');
        });

    it('It should also store a `value` property if passed in as part of the config/options object when the view is created.',
        function() {
          var input = new InputView({name: 'last_name', value: 'Last name'});
          expect(input.getValue()).toBe('Last name');
          input.render();
          expect(input.ui.input.val()).toBe('Last name');
        });

    it('It has a `isValid()` function that returns a boolean.', function() {
      var view = new InputView({
        name: 'last_name',
        value: 'Last name',
        tests: [
          function(value) {
            if (value.length <= 5) {
              return 'Must be greater than 5 characters';
            }
          },
        ],
      });

      expect(view.isValid()).toBeTruthy();
      view.setValue('hi');
      expect(view.isValid()).toBeFalsy();
    });

    it('It has a `getName()` function that returns the name of the field', function() {
      var view = new InputView({name: 'last_name'});

      expect(view.getName()).toBe('last_name');
    });

    it('It reports changes to its parent when it deems appropriate by calling `this.parent.update(this)`', function() {
      var count = 0;
      var isView = false;
      var parent = {
        update: function(fieldView) {
          count++;
          isView = fieldView instanceof Mn.View;
        }
      };
      var view = new InputView({name: 'last_name', value: 'initial name', parent: parent});

      expect(view.state.valid).toBeTruthy();
      view.listenTo(view.state, 'all', function(eventName, a, b) {
        console.info(eventName, typeof(a) ==='object' ? '': a, typeof(b) ==='object' ? '': b);
      });

      view.setValue('Last Name');
      expect(count).toBe(1);
      expect(isView).toBeTruthy();
    });

    it ('When rendered by a form-view, the form view creates a `parent` property that is a reference to the containing form view.', function() {
      var inputView = new InputView({
        name: 'organization'
      });

      var formView = new FormView({fields: [inputView]});

      expect(inputView.parent).toBe(formView);
    });

  });

});