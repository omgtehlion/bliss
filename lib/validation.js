var Failure, NoMatch, Success, Validation, failure, success,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Validation = (function() {

  function Validation() {}

  Validation.success = false;

  Validation.failure = false;

  Validation.prototype.get = function() {
    return;
  };

  return Validation;

})();

Success = (function(_super) {

  __extends(Success, _super);

  function Success(offset, value) {
    this.offset = offset;
    this.value = value;
    this.success = true;
  }

  Success.prototype.get = function() {
    return this.value;
  };

  Success.prototype.toString = function() {
    return toString('Success[', this.offset, '] := ', this.value);
  };

  return Success;

})(Validation);

success = function(offset, value) {
  return new Success(offset, value);
};

Failure = (function(_super) {

  __extends(Failure, _super);

  function Failure(offset, error, cause) {
    this.offset = offset;
    this.error = error;
    this.cause = cause;
    this.failure = true;
  }

  Failure.prototype.toString = function() {
    return toString('Failure[', this.offset, '] := ', this.error);
  };

  return Failure;

})(Validation);

failure = function(offset, error) {
  return new Failure(offset, error);
};

NoMatch = void 0;

module.exports = {
  Success: Success,
  success: success,
  Failure: Failure,
  failure: failure,
  NoMatch: NoMatch
};