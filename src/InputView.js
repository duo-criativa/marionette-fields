var pick = require('lodash/pick');
var Mn = require('backbone.marionette');
var State = require('ampersand-state');
require('marionette-bindings');

var InputState = State.extend({
  session: {
    tests: 'any'
  },

  props: {
    inputValue: 'any',
    startingValue: 'any',
    name: 'string',
    prefix_html_id: ['string', true, 'form_field_'],
    type: ['string', true, 'text'],
    placeholder: ['string', true, ''],
    label: ['string', true, ''],
    required: ['boolean', true, true],
    directlyEdited: ['boolean', true, false],
    readonly: ['boolean', true, false],
    autofocus: ['boolean', true, false],
    shouldValidate: ['boolean', true, false],
    message: ['string', true, ''],
    requiredMessage: ['string', true, 'This field is required.'],
    validClass: ['string', true, 'input-valid'],
    invalidClass: ['string', true, 'input-invalid'],
    validityClassSelector: ['string', true, 'input, textarea'],
    tabindex: ['number', true, 0]
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
    showMessage: {
      deps: ['message', 'shouldValidate'],
      fn: function () {
        return this.shouldValidate && this.message;
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
    var message = this.getErrorMessage();
    if (!message && this.inputValue && this.changed) {
      // if it's ever been valid,
      // we want to validate from now
      // on.
      this.shouldValidate = true;
    }
    this.message = message;
    return message;
  },

});

var InputView = Mn.View.extend({
  tagName: 'div',
  className: 'form-group',
  ui: {
    input: 'input'
  },
  template: function() {
    return  [
      '<label data-hook="label" for="exampleInputEmail1"></label>',
      '<input class="form-control">',
      '<div data-hook="message-container" class="message message-below message-error">',
      '<p data-hook="message-text"></p>',
      '</div>',
    ].join('');
  },
  bindings: {
    'state.inputValue': [
      {
        type: 'attribute',
        selector: 'input',
        name: 'value'
      },
      {
        type: 'text',
        selector: 'textarea',
      }
    ],
    'state.name': {
      type: 'attribute',
      selector: 'input, textarea',
      name: 'name'
    },
    'state.tabindex': {
      type: 'attribute',
      selector: 'input, textarea',
      name: 'tabindex'
    },
    'state.html_id': [
      {
        type: 'attribute',
        selector: 'input, textarea',
        name: 'id'
      },
      {
        type: 'attribute',
        selector: 'label',
        name: 'for'
      }
    ],
    'state.label': [
      {
        hook: 'label',
        type: 'text'
      },
      {
        type: 'toggle',
        hook: 'label'
      }
    ],
    'state.message': {
      type: 'text',
      hook: 'message-text'
    },
    'state.showMessage': {
      type: 'toggle',
      hook: 'message-container'
    },
    'state.placeholder': {
      type: 'attribute',
      selector: 'input, textarea',
      name: 'placeholder'
    },
    'state.readonly': {
      type: 'booleanAttribute',
      name: 'readonly',
      selector: 'input, textarea'
    },
    'state.autofocus': {
      type: 'booleanAttribute',
      name: 'autofocus',
      selector: 'input, textarea'
    }
  },
  initialize: function (spec) {
    spec || (spec = {});
    if (spec.parent) {
      this.parent = spec.parent;
    }
    this.state = new InputState();
    this.state.tests = this.tests || spec.tests || [];
    this.listenTo(this.state, 'change:type', this.handleTypeChange, this);
    this.handleChange = this.handleChange.bind(this);
    this.handleInputChanged = this.handleInputChanged.bind(this);
    var value = !spec.value && spec.value !== 0 ? '' : spec.value;
    this.state.startingValue = value;
    this.state.inputValue = value;
    this.listenTo(this.state, 'change:value', this.reportToParent);
    this.listenTo(this.state, 'change:validityClass', this.validityClassChanged);
    if (spec.autoRender) this.autoRender = spec.autoRender;
    if (spec.template) this.template = spec.template;
    if (spec.beforeSubmit) this.beforeSubmit = spec.beforeSubmit;

    this.state.set(pick(spec, ['name', 'value', 'id', 'tabindex', 'label', 'message', 'showMessage', 'placeholder', 'readonly', 'autofocus']))
  },

  getName: function() {
    return this.state.name;
  },

  getValue: function() {
    return this.state.value;
  },

  onRender: function () {
    /*this.renderWithTemplate();
    this.input = this.query('input') || this.query('textarea');
    // switches out input for textarea if that's what we want
    this.handleTypeChange();
    this.initInputBindings();
    // Skip validation on initial setValue
    // if the field is not required
    this.setValue(this.inputValue, !this.state.required);*/

    this.bindit();
  },

  setValue: function (value, skipValidation) {
    if (!this.ui.input || typeof(this.ui.input) === 'string') {
      // happens before rendering the view
      this.state.inputValue = value;
      return;
    }
    if (!value && value !== 0) {
      this.ui.input.val('');
    } else {
      this.ui.input.val(value.toString());
    }
    this.state.inputValue = this.clean(this.ui.input.val());
    if (!skipValidation && !this.getErrorMessage()) {
      this.state.shouldValidate = true;
    } else if (skipValidation) {
      this.state.shouldValidate = false;
    }
  },
  handleTypeChange: function () {
    // todo: review handleTypeChange
    return;
    /*if (this.state.type === 'textarea' && !this.ui.input.is('textarea')) {
      throw new Error("type === 'textarea', but element is not. You probably forgot to overwrite the template.");
      var parent = this.input.parentNode;
      var textarea = document.createElement('textarea');
      parent.replaceChild(textarea, this.input);
      this.input = textarea;
      this._applyBindingsForKey('');
    } else {
      this.input.type = this.state.type;
    }*/
  },
  clean: function (val) {
    return (this.state.type === 'number') ? Number(val) : val.trim();
  },
  //`input` event handler
  handleInputChanged: function () {
    if (document.activeElement === this.input) {
      this.state.directlyEdited = true;
    }
    this.state.inputValue = this.clean(this.input.value);
  },
  //`change` event handler
  handleChange: function () {
    if (this.state.inputValue && this.state.changed) {
      this.state.shouldValidate = true;
    }
    this.runTests();
  },
  beforeSubmit: function () {
    // catch undetected input changes that were not caught due to lack of
    // browser event firing see:
    // https://github.com/AmpersandJS/ampersand-input-view/issues/2
    this.inputValue = this.clean(this.ui.input.val());

    // at the point where we've tried
    // to submit, we want to validate
    // everything from now on.
    this.state.shouldValidate = true;
    this.runTests();
  },
  /*initInputBindings: function () {
    this.input.addEventListener('input', this.handleInputChanged, false);
    this.input.addEventListener('change', this.handleChange,false);
  },
  remove: function () {
    this.input.removeEventListener('input', this.handleInputChanged, false);
    this.input.removeEventListener('change', this.handleChange, false);
    View.prototype.remove.apply(this, arguments);
  },*/
  reset: function () {
    this.setValue(this.state.startingValue, true); //Skip validation just like on initial render
  },
  clear: function () {
    this.setValue('', true);
  },
  validityClassChanged: function (state, newClass) {
    var oldClass = state.previousAttributes().validityClass;
    this.$(state.validityClassSelector).removeClass(oldClass);
    this.$(state.validityClassSelector).addClass(newClass);
  },
  reportToParent: function () {
    if (this.parent) {
      this.parent.update(this);
    };
  },
  getErrorMessage: function() {
    return this.state.getErrorMessage();
  },
  runTests: function() {
    return this.state.runTests();
  },
  isValid: function() {
    return this.state.valid;
  }
});

module.exports = InputView;