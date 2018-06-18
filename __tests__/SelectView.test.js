var Mn = require('backbone.marionette');
var SelectView = require('../SelectView');
var FormView = require('../FormView');

var customTemplate = '<label class="custominput"><span data-hook="label"></span><select></select><div data-hook="message-container"><p data-hook="message-text"></p></div></label>';

function isHidden(el) {
  return el.style.display === 'none';
}

function hasClass(el, klass) {
  return el.classList.contains(klass);
}

describe('SelectView', function() {

  describe('requirements', function() {

    it('It is instance of Mn.View', function() {
      var input = new SelectView({});
      expect(input instanceof Mn.View).toBe(true);
    });

    it('It has a `getValue()` function that returns the current value of the field.',
        function() {
          var select = new SelectView({name: 'color', label: 'Color', options: ['blue', 'yellow', 'black']});
          expect(select.getValue()).toBe('');
        });

    it('It has a `setValue()` function that sets the current value of the field.',
        function() {
          var select = new SelectView({name: 'color', label: 'Color', options: ['blue', 'yellow', 'black']});
          expect(select.getValue()).toBe('');
          select.setValue('yellow');
          expect(select.getValue()).toBe('yellow');
          select.render();
          expect(select.ui.select.val()).toBe('yellow');
        });

    it('It should also store a `value` property if passed in as part of the config/options object when the view is created.',
        function() {
          var select = new SelectView({name: 'color', label: 'Color', options: [['10', 'blue'], ['20', 'yellow'], ['30', 'black']], value: '30'});
          expect(select.getValue()).toBe('30');
          select.render();
          expect(select.el).toMatchSnapshot();
          expect(select.ui.select.val()).toBe('30');
          expect(select.ui.select.find(':selected').text()).toBe('black');
        });

    it('It has a `isValid()` function that returns a boolean.', function() {
      var view = new SelectView({
        name: 'color',
        value: 'blue',
        options: ['yellow', 'blue'],
        tests: [
          function(value) {
            if (value === 'yellow') {
              return 'It\'s not allowed yellow right now.';
            }
          },
        ],
      });

      expect(view.isValid()).toBeTruthy();
      view.setValue('yellow');
      expect(view.isValid()).toBeFalsy();

      expect(function(){ view.setValue('brown'); }).toThrow('brown');
    });

    it('It has a `getName()` function that returns the name of the field',
        function() {
          var view = new SelectView({name: 'color'});

          expect(view.getName()).toBe('color');
        });

    it('It reports changes to its parent when it deems appropriate by calling `this.parent.update(this)`',
        function() {
          var count = 0;
          var isView = false;
          var parent = {
            update: function(fieldView) {
              count++;
              isView = fieldView instanceof Mn.View;
            }
          };
          var view = new SelectView({name: 'color', value: 'yellow', parent: parent, options: ['blue', 'yellow', 'black']});

          expect(view.state.valid).toBeTruthy();
          expect(view.state.isValid()).toBeTruthy();

          view.setValue('black');
          expect(count).toBe(1);
          expect(isView).toBeTruthy();
        });

    it('When rendered by a form-view, the form view creates a `parent` property that is a reference to the containing form view.',
        function() {
          var inputView = new SelectView({
            name: 'color'
          });

          var formView = new FormView({fields: [inputView]});

          expect(inputView.parent).toBe(formView);
        });

  });

  describe('behavior', function() {

    test('should get value from html', function() {
      var select = new SelectView({name: 'color', label: 'Color', options: ['blue', 'yellow', 'black'], unselectedText: 'Select a color'});

      select.render();

      select.ui.select.find('[value="yellow"]').prop('selected', true);
      select.handleInputChanged();
      select.handleChange();

      expect(select.getValue()).toBe('yellow');
    });
  });
});