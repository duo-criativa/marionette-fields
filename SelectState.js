var State = require('ampersand-state');

var SelectState = State.extend({
  session: {
    tests: 'any'
  },

  props: {
    inputValue: 'any',
    startingValue: 'any',
    name: 'string',
    prefix_html_id: ['string', true, 'form_field_'],
    label: ['string', true, ''],
    required: ['boolean', true, true],
    helpMessage: ['string', true, ''],
    autofocus: ['boolean', true, false],
    shouldValidate: ['boolean', true, false],
    validationMessage: ['string', true, ''],
    requiredMessage: ['string', true, 'This field is required.'],
    validClass: ['string', true, 'is-valid'],
    invalidClass: ['string', true, 'is-invalid'],
    validityClassSelector: ['string', true, 'input, textarea'],
    tabindex: ['number', true, 0],
    unselectedText: ['string', false],
    options: ['array', true, function () { return []; }]
  },

  derived: {
    html_id: {
      deps: ['name', 'prefix_html_id'],
      fn: function() {
        return this.prefix_html_id + this.name;
      }
    },
    value: {
      deps: ['inputValue'],
      fn: function () {
        return this.inputValue;
      }
    },
    valid: {
      cache: false,
      deps: ['inputValue'],
      fn: function () {
        return !this.runTests();
      }
    },
    showValidationMessage: {
      deps: ['validationMessage', 'shouldValidate'],
      fn: function () {
        return this.shouldValidate && this.validationMessage;
      }
    },
    changed: {
      deps: ['inputValue', 'startingValue'],
      fn: function () {
        return this.inputValue !== this.startingValue;
      }
    },
    validityClass: {
      deps: ['valid', 'validClass', 'invalidClass', 'shouldValidate'],
      fn: function () {
        if (!this.shouldValidate) {
          return '';
        } else {
          return this.valid ? this.validClass : this.invalidClass;
        }
      }
    }
  },

  getErrorMessage: function () {
    var message = '';
    if (this.required && this.value === '') {
      return this.requiredMessage;
    } else {
      (this.tests || []).some(function (test) {
        message = test.call(this, this.value) || '';
        return message;
      }, this);
      return message;
    }
  },
  runTests: function () {
    var errorMessage = this.getErrorMessage();
    if (!errorMessage && this.inputValue && this.changed) {
      // if it's ever been valid,
      // we want to validate from now
      // on.
      this.shouldValidate = true;
    }
    this.validationMessage = errorMessage;
    return errorMessage;
  },

});

module.exports = SelectState;

