var State = require('ampersand-state');
var set = require('lodash/set');
var isFunction = require('lodash/isFunction');
var result = require('lodash/result');

var FormState = State.extend({
  session: {
    valid: ['boolean', false, false],
    validated: ['boolean', false, false]
  },

  derived: {
    data: {
      fn: function () {
        var res = {};
        var fieldViews = this._formView.getFields();
        for (var key in fieldViews) {
          if (fieldViews.hasOwnProperty(key)) {
            // If field name ends with '[]', don't interpret
            // as verbose form field...
            if (key.match(/\[\]$/)) {
              res[key] = fieldViews[key].getValue();
            } else {
              set(res, key, fieldViews[key].getValue());
            }
          }
        }
        return this._formView.clean(res);
      },
      cache: false
    }
  },
});

module.exports = FormState;
