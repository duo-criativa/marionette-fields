var pick = require('lodash/pick');
var Mn = require('backbone.marionette');
var InputState = require('./InputState');
require('marionette-bindings');



var InputView = Mn.View.extend({
  tagName: 'div',
  className: 'form-group',
  ui: {
    input: 'input'
  },
  events: {
    'input @ui.input': 'handleInputChanged',
    'change @ui.input': 'handleChange'
  },
  template: function() {
    return  [
      '<label data-hook="label"></label>',
      '<input class="form-control">',
      '<small data-hook="help-message"></small>',
      '<div data-hook="validation-message"></div>',
    ].join('');
  },
  bindings: {
    'state.name': {
      type: 'attribute',
      selector: 'input, textarea',
      name: 'name'
    },
    'state.type': {
      type: 'attribute',
      selector: 'input',
      name: 'type'
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
    'state.validationMessage': {
      type: 'text',
      hook: 'validation-message'
    },
    'state.showMessage': {
      type: 'toggle',
      hook: 'validation-message'
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
    },
    'state.helpMessage': [
      {
        type: 'toggle',
        hook: 'help-message'
      },
      {
        type: 'text',
        hook: 'help-message'
      }
    ]
  },
  stateClass: InputState,
  initialize: function (spec) {
    spec || (spec = {});
    if (spec.parent) {
      this.parent = spec.parent;
    }
    this.state = new (this.stateClass);
    this.state.tests = this.tests || spec.tests || [];
    this.state.helpMessage = this.helpMessage || spec.helpMessage || '';
    this.listenTo(this.state, 'change:type', this.handleTypeChange, this);
    // this.handleChange = this.handleChange.bind(this);
    // this.handleInputChanged = this.handleInputChanged.bind(this);
    var value = !spec.value && spec.value !== 0 ? '' : spec.value;
    this.state.startingValue = value;
    this.state.inputValue = value;
    this.listenTo(this.state, 'change:value', this.reportToParent);
    this.listenTo(this.state, 'change:validityClass', this.validityClassChanged);
    if (spec.template) {
      this.template = spec.template;
      delete spec.template;
    }
    if (spec.beforeSubmit) {
      this.beforeSubmit = spec.beforeSubmit;
      delete spec.beforeSubmit;
    }

    this.state.set(spec);
  },

  getName: function() {
    return this.state.name;
  },

  getValue: function() {
    return this.state.value;
  },

  onRender: function () {
    this.handleTypeChange();
    /*this.renderWithTemplate();
    this.input = this.query('input') || this.query('textarea');
    // switches out input for textarea if that's what we want
    this.initInputBindings();*/
    // Skip validation on initial setValue
    // if the field is not required
    this.setValue(this.inputValue, !this.state.required);

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
    if (typeof(this.ui.input) === 'string') {
      return;
    }
    if (this.state.type === 'textarea' && !this.ui.input.is('textarea')) {
      throw new Error("type === 'textarea', but element is not. You probably forgot to overwrite the template.");
    }
  },
  clean: function (val) {
    return (this.state.type === 'number') ? Number(val) : val.trim();
  },
  //`input` event handler
  handleInputChanged: function () {
    if (document.activeElement === this.ui.input.get(0)) {
      this.state.directlyEdited = true;
    }
    this.state.inputValue = this.clean(this.ui.input.val());
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
    this.state.inputValue = this.clean(this.ui.input.val());

    // at the point where we've tried
    // to submit, we want to validate
    // everything from now on.
    this.state.shouldValidate = true;
    this.runTests();
  },
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
    const result = this.state.runTests();
    // Setup HTML5 custom validation (https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation)
    this.ui.input.get(0).setCustomValidity(result);
    return result;
  },
  isValid: function() {
    return this.state.valid;
  }
});

module.exports = InputView;