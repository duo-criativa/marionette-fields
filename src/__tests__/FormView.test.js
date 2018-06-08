var Mn = require('backbone.marionette');
var FormView = require('../FormView');
var InputView = require('../InputView');

describe('FormView', function() {

  describe('initialization', function() {

    test('requires `fields` defined.', function() {

      var Form = FormView.extend({});

      expect(function(){new Form()}).toThrow(/fields/)

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