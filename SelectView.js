var map = require('lodash/map');
var includes = require('lodash/includes');
var pick = require('lodash/pick');
var Mn = require('backbone.marionette');
var SelectState = require('./SelectState');
var DataBinder = require('marionette-bindings');

var SelectView = Mn.View.extend({
  tagName: 'div',
  className: 'form-group',
  ui: {
    select: 'select',
  },
  events: {
    'input @ui.select': 'handleInputChanged',
    'change @ui.select': 'handleChange',
  },

  template: function() {
    return [
      '<label data-hook="label"></label>',
      '<select class="form-control"></select>',
      '<small data-hook="help-message"></small>',
      '<div data-hook="validation-message"></div>',
    ].join('');
  },

  bindings: {
    'name': {
      type: 'attribute',
      selector: 'select',
      name: 'name',
    },
    'tabindex': {
      type: 'attribute',
      selector: 'select',
      name: 'tabindex',
    },
    'html_id': [
      {
        type: 'attribute',
        selector: 'select',
        name: 'id',
      },
      {
        type: 'attribute',
        selector: 'label',
        name: 'for',
      },
    ],
    'label': [
      {
        hook: 'label',
        type: 'text',
      },
      {
        type: 'toggle',
        hook: 'label',
      },
    ],
    'validationMessage': {
      type: 'text',
      hook: 'validation-message',
    },
    'showValidationMessage': {
      type: 'toggle',
      hook: 'validation-message',
    },
    'autofocus': {
      type: 'booleanAttribute',
      name: 'autofocus',
      selector: 'select',
    },
    'helpMessage': [
      {
        type: 'toggle',
        hook: 'help-message',
      },
      {
        type: 'text',
        hook: 'help-message',
      },
    ],
  },
  stateClass: SelectState,
  initialize: function(spec) {
    spec || (spec = {});
    if (spec.parent) {
      this.parent = spec.parent;
    }
    this.state = new (this.stateClass);
    this.state.tests = this.tests || spec.tests || [];
    this.state.helpMessage = this.helpMessage || spec.helpMessage || '';
    var value = !spec.value && spec.value !== 0 ? '' : spec.value;
    this.state.startingValue = value.toString();
    this.state.inputValue = this.state.startingValue;
    this.listenTo(this.state, 'change:value', this.reportToParent);
    this.listenTo(this.state, 'change:validityClass',
        this.validityClassChanged);
    if (spec.template) {
      this.template = spec.template;
      delete spec.template;
    }
    if (spec.beforeSubmit) {
      this.beforeSubmit = spec.beforeSubmit;
      delete spec.beforeSubmit;
    }

    spec.options = this._buildOptions(spec);
    this.state.set(spec);

    var self = this;
    this.listenTo(this, 'render', function() {
      var html = '';
      self.state.options.forEach(function(opt) {
        html += '<option value="' + opt.value + '">' + opt.label + '</option>';
      });
      self.ui.select.html(html);
      // Skip validation on initial setValue
      // if the field is not required
      self.setValue(self.state.inputValue, !self.state.required);

      DataBinder.bind(self, self.state, self.bindings);
    });
  },

  getName: function() {
    return this.state.name;
  },

  getValue: function() {
    return this.state.value;
  },

  setValue: function(value, skipValidation) {
    this.getOptionByValue(value);

    if (!this.ui.select || typeof(this.ui.select) === 'string') {
      // happens before rendering the view
      this.state.inputValue = value.toString();
      return;
    }
    if (value === null || value === undefined || value === '') {
      this.ui.select.val('');
    } else {
      this.ui.select.val(value.toString());
    }
    this.state.inputValue = this.ui.select.val();
    if (!skipValidation && !this.getErrorMessage()) {
      this.state.shouldValidate = true;
    } else if (skipValidation) {
      this.state.shouldValidate = false;
    }
  },
//`input` event handler
  handleInputChanged: function() {
    this.state.inputValue = this.ui.select.val();
  },
//`change` event handler
  handleChange: function() {
    if (this.state.inputValue && this.state.changed) {
      this.state.shouldValidate = true;
    }
    this.runTests();
  },
  beforeSubmit: function() {
    // catch undetected input changes that were not caught due to lack of
    // browser event firing see:
    // https://github.com/AmpersandJS/ampersand-input-view/issues/2
    this.state.inputValue = this.ui.select.val();

    // at the point where we've tried
    // to submit, we want to validate
    // everything from now on.
    this.state.shouldValidate = true;
    this.runTests();
  },
  reset: function() {
    this.setValue(this.state.startingValue, true); //Skip validation just like on initial render
  },
  clear: function() {
    this.setValue('', true);
  },
  validityClassChanged: function(state, newClass) {
    var oldClass = state.previousAttributes().validityClass;
    this.$(state.validityClassSelector).removeClass(oldClass);
    this.$(state.validityClassSelector).addClass(newClass);
  },
  reportToParent: function() {
    if (this.parent) {
      this.parent.update(this);
    }
    ;
  },
  getErrorMessage: function() {
    return this.state.getErrorMessage();
  },
  runTests: function() {
    const result = this.state.runTests();
    // Setup HTML5 custom validation (https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation)
    this.ui.select.get(0).setCustomValidity(result);
    return result;
  },
  isValid: function() {
    return this.state.valid;
  },
  getOptionByValue: function(value) {
    const allowedValues = map(this.state.options, function(option) {
      return option.value;
    });

    if (!includes(allowedValues, value)) {
      throw new Error('Value \'' + value + '\' is not valid.');
    }
  },

  _buildOptions: function(spec){
    var options = [];
    if (spec.unselectedText) {
      options.push({label: spec.unselectedText, value: ''});
    }
    if (Array.isArray(spec.options)) {
      for(var i = 0; i < spec.options.length; i++) {
        var option = spec.options[i];
        var opt = {};
        if (typeof(option) === 'string') {
          opt.value = option;
          opt.label = option;
        }
        if (Array.isArray(option)) {
          opt.value = option[0];
          opt.label = option[1];
        }
        options.push(opt);
      }
    }
    return options;
  }
});

module.exports = SelectView;
