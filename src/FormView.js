// var _ = require('underscore');
// var Bb = require('backbone');
var Mn = require('backbone.marionette');
require('marionette-bindings');
// var bindings = require('ampersand-dom-bindings');
// var getPath = require('lodash/get');
// var last = require("lodash/last");

var FormView = Mn.View.extend({
  tagName: 'form',
  buildFieldTemplate: function(fieldName) {
    return '<div data-hook="field-' + fieldName + '"></div>';
  },
  getTemplate: function() {
    var template = '';
    var fields = this.getOption('fields');
    for (var key in fields) {
      template += this.buildFieldTemplate(fields[key].getName());
    }
    return function() {
      return template;
    };
  },
  regions: function() {
    var regions = {};
    var fields = this.getOption('fields');
    for (var key in fields) {
      var name = fields[key].getName();
      regions[name] = '[data-hook="field-' + name + '"]';
    }
    return regions;
  },

  initialize: function(options) {
    this.initializeForm(options || {});
  },

  initializeForm: function(options) {
    var fields = options.fields || this.fields;
    if (!fields) {
      throw new Error('You must pass `fields` of form.');
    }
    this.fields = fields;

    this.validCallback = options.validCallback || this.validCallback;
    this.submitCallback = options.submitCallback || this.submitCallback;
    this.clean = options.clean || this.clean || function(res) {
      return res;
    };

    // storage for our fields
    this._fieldViews = {};
    this._fieldViewsArray = [];

    for (var key in fields) {
      fields[key].parent = this;
      this.addField(fields[key]);
    }

    if (options.values) this._startingValues = options.values;

    if (this.validCallback) {
      this.on('valid', function(view, validBool) {
        this.validCallback(validBool);
      });
    }

    if (this.submitCallback) {
      this.on('submit', this.submitCallback);
    }
  },

  onRender: function() {
    var self = this;
    var fields = this.fields;
    fields.forEach(function(field) {
      var name = field.getName();
      self.showChildView(name, field);
    });
  },

  addField: function(fieldView) {
    this._fieldViews[fieldView.getName()] = fieldView;
    this._fieldViewsArray.push(fieldView);
    return this;
  },

  removeField: function(fieldName, strict) {
    var field = this.getField(name, strict);
    if (field) {
      field.remove();
      delete this._fieldViews[name];
      this._fieldViewsArray.splice(this._fieldViewsArray.indexOf(field), 1);
    }
  },

  getField: function(fieldName, strict) {
    var field = this._fieldViews[name];
    if (!field && strict) {
      throw new ReferenceError('field name  "' + name + '" not found');
    }
    return field;
  },

  getValue: function(name) {
    return this.getField(name, true).getValue();
  },

  setValue: function(name, value) {
    this.getField(name, true).setValue(value);
    return this;
  },

  setValues: function(data) {
    for (var name in data) {
      if (data.hasOwnProperty(name)) {
        this.setValue(name, data[name]);
      }
    }
  },

  checkValid: function() {
    this.valid = this._fieldViewsArray.every(function(field) {
      return field.valid;
    });
    return this.valid;
  },

  beforeSubmit: function() {
    this._fieldViewsArray.forEach(function(field) {
      if (field.beforeSubmit) field.beforeSubmit();
    });
  },

  update: function(field) {
    this.trigger('change:' + field.getName(), field);
    // if this one's good check 'em all
    if (field.valid) {
      this.checkValid();
    } else {
      this.valid = false;
    }
  },

  handleSubmit: function(e) {
    this.beforeSubmit();
    this.checkValid();
    if (!this.valid) {
      e.preventDefault();
      return false;
    }

    if (this.preventDefault) {
      e.preventDefault();
      this.trigger('submit', this.data);
      return false;
    }
  },

  reset: function() {
    this._fieldViewsArray.forEach(function(field) {
      if (isFunction(field.reset)) {
        field.reset();
      }
    });
  },

  clear: function() {
    this._fieldViewsArray.forEach(function(field) {
      if (isFunction(field.clear)) {
        field.clear();
      }
    });
  },
});

module.exports = FormView;