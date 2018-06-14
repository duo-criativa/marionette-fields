var Mn = require('backbone.marionette');
var InputView = require('../InputView');
var FormView = require('../FormView');

var customTemplate = '<label class="custominput"><span data-hook="label"></span><input><div data-hook="message-container"><p data-hook="message-text"></p></div></label>';

function isHidden(el) {
  return el.style.display === 'none';
}

function hasClass(el, klass) {
  return el.classList.contains(klass);
}

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

  describe('behavior', function() {

    test('initialize with number value and type preserved after render', function () {
      var position = 1;
      var input = new InputView({
        name: 'position',
        value: position,
        type: 'number'
      });

      expect(input.getValue()).toBe(position);

      input.render();

      expect(input.$el.find('input').attr('type')).toBe('number');
      expect(input.el.outerHTML).toMatchSnapshot();
    });

    test('can initialize with template without having to extend', function () {
      var input = new InputView({
        name: 'title',
        value: 'Once upon a time',
        template: function(){ return customTemplate; }
      });

      input.render();

      expect(input.$('> label').hasClass('custominput')).toBeTruthy();
    });

    test('should be able to extend a template as well', function () {
      var input = new (InputView.extend({
        template: function(){ return customTemplate;}
      }))({name: 'title',
        value: 'Once upon a time',
      });

      input.render();

      expect(input.$('> label').hasClass('custominput')).toBeTruthy();
    });

    test('reset value', function () {
      var input = new InputView({
        name: 'title'
      });
      input.render();
      input.setValue('something');
      expect(input.ui.input.val()).toBe('something');
      input.reset();
      expect(input.ui.input.val()).toBe('');

      var input2 = new InputView({
        name: 'title',
        value: 'start'
      });
      input2.render();
      expect(input2.ui.input.val()).toBe('start');
      input2.setValue('somethingelse');
      expect(input2.ui.input.val()).toBe('somethingelse');
      input2.reset();
      expect(input2.ui.input.val()).toBe('start');

      input.beforeSubmit(); //Turn on shouldValidate
      input.reset();
      expect(input.state.shouldValidate).toBe(false);
    });

    test('clear', function () {
      var input = new InputView({
        name: 'title',
        value: 'something'
      });
      input.render();

      expect(input.ui.input.val()).toBe('something');
      input.reset();
      expect(input.ui.input.val()).toBe('something');
      input.clear();
      expect(input.ui.input.val()).toBe('');
      expect(input.getValue()).toBe('');

      var input2 = new InputView({
        name: 'thing'
      });
      input2.render();
      expect(input2.getValue()).toBe('');
      input2.setValue('thing');
      expect(input2.ui.input.val()).toBe('thing');
      expect(input2.getValue()).toBe('thing');
      input2.clear();
      expect(input2.ui.input.val()).toBe('');
      expect(input2.getValue()).toBe('');

      input.beforeSubmit(); //Turn on shouldValidate
      input.clear();
      expect(input.state.shouldValidate).toBe(false);
    });

    test('initalize with a value of `0`', function() {
      var input = new InputView({
        name: 'title',
        type: 'number',
        value: 0
      });

      input.render();

      expect(parseFloat(input.ui.input.val())).toBe(0);
    });

    test('value `0` should be treated as a valid value if required is set to true', function() {
      var input = new InputView({
        name: 'title',
        type: 'number',
        value: 0,
        required: true
      });

      input.render();

      var inputElement = input.el.querySelector('input');
      var messageContainer = input.el.querySelector('[data-hook=message-container]');

      expect(isHidden(messageContainer)).toBeTruthy();

      inputElement.value = 1;
      input.handleInputChanged();
      input.handleChange();
      expect(isHidden(messageContainer)).toBeTruthy();

      inputElement.value = 0;
      input.handleInputChanged();
      input.handleChange();
      expect(isHidden(messageContainer)).toBeTruthy();

    });


    test('Tests with required true and false', function () {
      var inputs = [
        new InputView({
          name: 'title',
          required: true,
          tests: [
            function (val) {
              if (val.length < 5) return 'Must be 5+ characters.';
            }
          ]
        }),
        new InputView({
          name: 'title',
          required: false,
          tests: [
            function (val) {
              if (val.length < 5) return 'Must be 5+ characters.';
            }
          ]
        }),
      ];

      inputs.forEach(function (input) {
        input.render();

        var inputElement = input.el.querySelector('input');
        var messageContainer = input.el.querySelector('[data-hook=message-container]');

        //"Trigger change events"
        //TODO: this should be real dom events
        inputElement.value = 'O';
        input.handleInputChanged();

        // At this point we are not yet blurred so there should no messages or classes
        expect(input.isValid()).toBeFalsy(); //'Input should be invalid'
        expect(isHidden(messageContainer)).toBeTruthy();  //'Message should not be visible'
        expect(hasClass(inputElement, 'input-invalid')).toBeFalsy(); // 'Does not have invalid class'
        expect(hasClass(inputElement, 'input-valid')).toBeFalsy(); // 'Doest not have valid class'

        // Another change to an empty state
        inputElement.value = '';
        input.handleInputChanged();


        // should still not show errors
        expect(input.isValid()).toBeFalsy(); // 'Input should be invalid'
        expect(isHidden(messageContainer)).toBeTruthy(); // 'Message should not be visible'
        expect(hasClass(inputElement, 'input-invalid')).toBeFalsy(); // 'Does not have invalid class'
        expect(hasClass(inputElement, 'input-valid')).toBeFalsy(); // 'Doest not have valid class'

        // Blur to trigger invalid message/class
        inputElement.value = 'O';
        input.handleInputChanged();
        input.handleChange();

        expect(input.isValid()).toBeFalsy(); // 'Input should be invalid'
        expect(isHidden(messageContainer)).toBeFalsy(); // 'Message should be visible'
        expect(hasClass(inputElement, 'input-invalid')).toBeTruthy(); // 'Has invalid class'
        expect(hasClass(inputElement, 'input-valid')).toBeFalsy(); // 'Does not have valid class'

        //"Trigger change events again"
        inputElement.value = 'Once upon a time!';
        input.handleInputChanged();
        input.handleChange();

        expect(input.isValid()).toBeTruthy(); // 'Input should be valid'
        expect(isHidden(messageContainer)).toBeTruthy(); // 'Message should not be visible'
        expect(hasClass(inputElement, 'input-invalid')).toBeFalsy(); // 'Does not have invalid class'
        expect(hasClass(inputElement, 'input-valid')).toBeTruthy(); // 'Has valid class'
      });

    });

    test ('validityClassSelector', function () {
      var input = new InputView({
        name: 'title',
        validityClassSelector: 'label',
        required: true
      });

      input.render();
      var inputElement = input.el.querySelector('input');
      input.beforeSubmit();
      console.info('classList',input.el.classList);
      expect(hasClass(input.el.querySelector('label'), 'input-invalid')).toBeTruthy(); // 'Label has invalid class'
      expect(hasClass(input.el.querySelector('label'), 'input-valid')).toBeFalsy(); // 'Label does not have valid class'
      expect(hasClass(inputElement, 'input-invalid')).toBeFalsy(); // 'Input does not have invalid class'
      expect(hasClass(inputElement, 'input-valid')).toBeFalsy(); // 'Input does not have valid class'

      input = new InputView({
        name: 'title',
        validityClassSelector: 'label, input',
        required: true
      });

      input.render();
      inputElement = input.el.querySelector('input');
      input.beforeSubmit();
      expect(hasClass(input.el.querySelector('label'), 'input-invalid')).toBeTruthy(); // 'Label has invalid class'
      expect(hasClass(input.el.querySelector('label'), 'input-valid')).toBeFalsy(); // 'Label does not have valid class'
      expect(hasClass(inputElement, 'input-invalid')).toBeTruthy(); // 'Input has invalid class'
      expect(hasClass(inputElement, 'input-valid')).toBeFalsy(); // 'Input does not have valid class'

    });

    test('should show `helpMessage`', function() {
      var input = new InputView({});

      input.render();

      expect(input.$('[data-hook=help-message]').css('display')).toBe('none');
      expect(input.$('[data-hook=help-message]').text()).toBe('');

      input.state.helpMessage = 'This is a tip.';

      expect(input.$('[data-hook=help-message]').css('display')).toBe('block');
      expect(input.$('[data-hook=help-message]').text()).toBe('This is a tip.');

    });

    test('initialize with `helpMessage`', function() {
      var input = new InputView({helpMessage: 'This is a tip.'});

      input.render();

      expect(input.$('[data-hook=help-message]').css('display')).toBe('block');
      expect(input.$('[data-hook=help-message]').text()).toBe('This is a tip.');

    });

    test('extend with `helpMessage`', function() {
      var input = new (InputView.extend({helpMessage: 'This is a tip.'}));

      input.render();

      expect(input.$('[data-hook=help-message]').css('display')).toBe('block');
      expect(input.$('[data-hook=help-message]').text()).toBe('This is a tip.');

    });

  });
});