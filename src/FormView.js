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
  buildFormTemplate: function() {
    var template = '';
    var names = this._getFieldNames();
    for (var i = 0; i < names.length; i++) {
      template += this.buildFieldTemplate(names[i]);
    }
    return template;
  },
  getTemplate: function() {
    var template = this.buildFormTemplate();
    return function() {
      return template;
    };
  },
  regions: function() {
    var regions = {};
    var names = this._getFieldNames();
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      regions[name] = '[data-hook="field-' + name + '"]';
    }
    return regions;
  },

  initialize: function(options) {
    this.initializeForm(options || {});
  },

  initializeForm: function(options) {

    this.validCallback = options.validCallback || this.validCallback;
    this.submitCallback = options.submitCallback || this.submitCallback;
    this.clean = options.clean || this.clean || function(res) {
      return res;
    };

    if (options.values) this._startingValues = options.values;

    if (this.validCallback) {
      this.on('valid', function(view, validBool) {
        this.validCallback(validBool);
      });
    }

    if (this.submitCallback) {
      this.on('submit', this.submitCallback);
    }

    var self = this;
    this.listenTo(this, 'render', function() {
      var fields = self.getFields();
      for (var name in fields) {
        if (!fields.hasOwnProperty(name)) {
          continue;
        }
        self.showChildView(name, fields[name]);
      }
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
    var field = this.getFields()[name];
    if (!field && strict) {
      throw new ReferenceError('field name  "' + name + '" not found');
    }
    return field;
  },

  getFields: function() {
    if (this._fieldViews === undefined) {
      var fields = this.getOption('fields') || this.fields;
      if (!fields) {
        throw new Error('You must pass `fields` of form.');
      }
      if (typeof(fields) == 'function') {
        fields = fields.call(this);
      }
      // storage for our fields
      this._fieldViews = {};
      this._fieldViewsArray = [];

      for (var key in fields) {
        fields[key].parent = this;
        this.addField(fields[key]);
      }
    }
    return this._fieldViews;
  },

  getFieldsArray: function() {
    this.getFields();
    return this._fieldViewsArray;
  },

  _getFieldNames: function() {
    var names = [];
    for(var name in this.getFields()) {
      names.push(name);
    }
    return names;
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
    this.valid = this.getFieldsArray().every(function(field) {
      return field.valid;
    });
    return this.valid;
  },

  beforeSubmit: function() {
    this.getFieldsArray().forEach(function(field) {
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
    this.getFieldsArray().forEach(function(field) {
      if (isFunction(field.reset)) {
        field.reset();
      }
    });
  },

  clear: function() {
    this.getFieldsArray().forEach(function(field) {
      if (isFunction(field.clear)) {
        field.clear();
      }
    });
  },
});

module.exports = FormView;