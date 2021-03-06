var Mn = require('backbone.marionette');
var FormView = require('../FormView');
var InputView = require('../InputView');

function isHidden(el) {
  return el.style.display === 'none';
}

function hasClass(el, klass) {
  return el.classList.contains(klass);
}

/*function FakeField(opts) {
  opts = opts || {};

  this.valid = opts.valid === false ? false : true;
  this.name = opts.name || 'fake-field';
  this.value = opts.value || 'fake-value';
  this.parent = opts.parent || null;
  this.beforeSubmit = opts.beforeSubmit || function() {};
}
FakeField.prototype = {
  getName: function() {
    return this.name;
  },
  setValue: function(value) {
    this.value = value;
    this.updateParent();
  },

  setValid: function(valid) {
    this.valid = valid;
    this.updateParent();
  },

  isValid: function() {
    return this.valid;
  },

  updateParent: function() {
    if (this.parent) {
      this.parent.update(this);
    }
  },

  render: function() {
    if (!this.el) {
      this.el = document.createElement('div');
    }
    return this;
  },

  remove: function() {
  }
};*/

describe('FormView', function() {

  describe('initialization', function() {

    test('requires `fields` defined.', function() {

      var Form = FormView.extend({});

      expect(function(){new Form()}).toThrow(/fields/)

    });

    test('`fields` can be defined as function.', function() {

      var form = new (FormView.extend({
        fields: function() {
          return [
            new InputView({
              name: 'client_name',
              label: 'App Name'
            })
          ];
        }
      }));

      form.render();

      expect(form.getFieldsArray().length).toBe(1);
      expect(form.hasField('client_name')).toBeTruthy();

    });

  });

  describe('render', function() {

    test('should have HTML like this', function() {
      var form = new FormView({
        fields: [
          new InputView({
            name: 'client_name',
            label: 'App Name',
            placeholder: 'My Awesome App',
            // an initial value if it has one
            value: 'hello',
            // this one takes an array of tests
            tests: [
              function (val) {
                if (val.length < 5) return "Must be 5+ characters.";
              }
            ]
          })
        ]
      });

      form.render();

      expect(form.el.outerHTML).toMatchSnapshot();
    });

    test('should add was-validated class to form element', function() {

      var form = new FormView({
        fields: [
          new InputView({
            name: 'name',
            label: 'Your name',
            required: true
          }),
          new InputView({
            name: 'age',
            label: 'Your age',
            required: true,
            tests: [
                function(value){
                  return 'Your age is not valid!';
                }
            ]
          })
        ]
      });

      form.render();

      expect(form.state.valid).toBe(false);
      expect(form.state.validated).toBe(false);
      expect(hasClass(form.el, 'was-validated')).toBeFalsy();

      expect(form.el).toMatchSnapshot();

      form.getField('name', true).setValue('test');
      form.handleSubmit(document.createEvent('Event'));

      expect(form.state.valid).toBe(false);
      expect(form.state.validated).toBe(true);
      expect(hasClass(form.el, 'was-validated')).toBeTruthy();

      expect(form.el).toMatchSnapshot();

    });

    test('should accept `strict` on `setValues`', function() {
      var form = new FormView({
        fields: [
          new InputView({
            name: 'client_name',
            label: 'App Name',
            placeholder: 'My Awesome App',
            // an initial value if it has one
            value: 'hello',
          })
        ]
      });

      expect(form.state.data).toEqual({client_name: 'hello'});

      form.setValues({client_name: 'my name', does_not_exist: 'any value'}, false);

      expect(form.state.data).toEqual({client_name: 'my name'});

      expect(function(){ form.setValues({client_name: 'my name', does_not_exist: 'any value'}, true); }).toThrow();
    });


  });

});
