var Mn = require('backbone.marionette');
var FormView = require('../FormView');
var InputView = require('../InputView');


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

    });

  });

  describe('render', function() {

    var form = new (FormView.extend({
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
    }));

    form.render();

    expect(form.el.outerHTML).toMatchSnapshot();

  });

});