var ACCESS, ANCHOR, Access, Anchor, BLOCK, Block, Content, DO, DO_WHILE, DoWhile, ELSE, Else, FOR, FUNC, Failure, For, Func, GROUP, Group, IDENTIFIER, IF, INVOKE, If, Invoke, MEMBER, Member, NoMatch, PARAMETERS, Parameters, ScriptBlock, Success, TRAILING_SPACES, Tokenizer, Value, WHILE, WHITESPACE, While, failure, success, _ref, _ref2;

_ref = require('./tags'), Anchor = _ref.Anchor, Content = _ref.Content, Group = _ref.Group, Block = _ref.Block, ScriptBlock = _ref.ScriptBlock, If = _ref.If, Else = _ref.Else, For = _ref.For, While = _ref.While, DoWhile = _ref.DoWhile, Func = _ref.Func, Parameters = _ref.Parameters, Value = _ref.Value, Member = _ref.Member, Access = _ref.Access, Invoke = _ref.Invoke;

_ref2 = require('./validation'), Success = _ref2.Success, success = _ref2.success, Failure = _ref2.Failure, failure = _ref2.failure, NoMatch = _ref2.NoMatch;

WHITESPACE = /^[^\n\S]+/;

TRAILING_SPACES = /\s+$/;

ANCHOR = /^@/;

PARAMETERS = /^!\(/;

IF = /^if\s*\(/;

ELSE = /^\s*else\s*/;

FOR = /^for\s*\(/;

WHILE = /^while\s*\(/;

DO = /^do\s*\{/;

DO_WHILE = /^\s*while\s*\(/;

FUNC = /^function(?:\s+([$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*))?\s*\(/;

GROUP = /^\s*\(/;

BLOCK = /^\s*\{/;

IDENTIFIER = /^[$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*/;

MEMBER = /^\s*\./;

ACCESS = /^\s*\[/;

INVOKE = /^\s*\(/;

module.exports = Tokenizer = (function() {

  function Tokenizer() {}

  Tokenizer.prototype.tokenize = function(source, options) {
    if (WHITESPACE.test(source)) source = "\n" + source;
    source = source.replace(/\r/g, '').replace(TRAILING_SPACES, '');
    return this.replace(source, '@', this.Anchor.bind(this));
  };

  Tokenizer.prototype.replace = function(source, token, callback) {
    var index, offset, result, results;
    results = [];
    while ((index = source.indexOf(token)) >= 0) {
      if (index > 0) results.push(source.slice(0, (index - 1) + 1 || 9e9));
      source = source.slice(index);
      result = callback(source);
      if (result != null) {
        if (result.success) {
          offset = result.offset;
          source = source.slice(offset);
          results.push(result.get());
        } else {
          throw result;
        }
      }
    }
    if (source.length > 0) results.push(source);
    return results;
  };

  Tokenizer.prototype.pair = function(str, left, right) {
    var c, i, pairs, start, _len;
    pairs = 0;
    start = 0;
    for (i = 0, _len = str.length; i < _len; i++) {
      c = str[i];
      switch (c) {
        case left:
          pairs++;
          break;
        case right:
          pairs--;
          if (pairs === 0) return i + 1;
      }
    }
    return 0;
  };

  Tokenizer.prototype.Anchor = function(chunk) {
    var offset, result, start, value;
    if (chunk[0] !== '@') return NoMatch;
    start = 1;
    chunk = chunk.slice(start);
    result = this.Parameters(chunk) || this.Escape(chunk) || this.If(chunk) || this.For(chunk) || this.While(chunk) || this.DoWhile(chunk) || this.Func(chunk) || this.Group(chunk) || this.ScriptBlock(chunk) || this.Value(chunk);
    if (result != null ? result.success : void 0) {
      offset = start + result.offset;
      value = new Anchor(result.get());
      return success(offset, value);
    } else {
      return success(1, new Content('@'));
    }
    return result;
  };

  Tokenizer.prototype.Parameters = function(chunk) {
    var end, error, match, offset, parameters, start, value;
    if (!(match = PARAMETERS.exec(chunk))) return NoMatch;
    start = match[0].length - 1;
    chunk = chunk.slice(start);
    end = this.pair(chunk, '(', ')');
    if (end) {
      parameters = chunk.slice(1, (end - 1)).split(',').map(function(p) {
        return p.trim();
      });
      offset = start + end;
      value = new Parameters(parameters);
      return success(offset, value);
    } else {
      offset = start;
      error = 'malformed parameters';
      return failure(offset, error);
    }
  };

  Tokenizer.prototype.Escape = function(chunk) {
    var match;
    if (!(match = ANCHOR.exec(chunk))) return NoMatch;
    return success(1, new Content('@'));
  };

  Tokenizer.prototype.Group = function(chunk) {
    var end, error, match, offset, start, value;
    if (!(match = GROUP.exec(chunk))) return NoMatch;
    start = match[0].length - 1;
    chunk = chunk.slice(start);
    end = this.pair(chunk, '(', ')');
    if (!end) {
      offset = start;
      error = 'malformed group';
      return failure(offset, error);
    }
    offset = start + end;
    value = new Group(chunk.slice(1, (end - 1)));
    return success(offset, value);
  };

  Tokenizer.prototype.Block = function(chunk) {
    var content, end, error, match, offset, result, results, start, value, _i, _len;
    if (!(match = BLOCK.exec(chunk))) return NoMatch;
    start = match[0].length - 1;
    chunk = chunk.slice(start);
    end = this.pair(chunk, '{', '}');
    if (!end) {
      offset = start;
      error = 'malformed block';
      return failure(offset, error);
    }
    chunk = chunk.slice(1, (end - 1));
    results = this.tokenize(chunk);
    content = [];
    for (_i = 0, _len = results.length; _i < _len; _i++) {
      result = results[_i];
      if (!result || result.failure) {
        return result;
      } else if (result.value != null) {
        content.push(result.value);
      } else {
        content.push(result);
      }
    }
    offset = start + end;
    value = new Block(content);
    return success(offset, value);
  };

  Tokenizer.prototype.ScriptBlock = function(chunk) {
    var end, error, match, offset, start, value;
    if (!(match = BLOCK.exec(chunk))) return NoMatch;
    start = match[0].length - 1;
    chunk = chunk.slice(start);
    end = this.pair(chunk, '{', '}');
    if (!end) {
      offset = start;
      error = 'malformed block';
      return failure(offset, error);
    }
    offset = start + end;
    value = new ScriptBlock(chunk.slice(1, (end - 1)));
    return success(offset, value);
  };

  Tokenizer.prototype.Else = function(chunk) {
    var block, error, match, offset, start, stmt, value;
    if (!(match = ELSE.exec(chunk))) return NoMatch;
    start = match[0].length;
    chunk = chunk.slice(start);
    block = this.Block(chunk);
    if (!block) {
      stmt = this.If(chunk);
      if (!stmt) {
        offset = start;
        error = 'malformed else statement';
        return failure(offset, error);
      } else if (stmt.error) {
        return stmt.error;
      } else {
        offset = start + stmt.offset;
        value = new Else(stmt.get());
        return success(offset, value);
      }
    } else {
      offset = start + block.offset;
      value = new Else(block.get());
      return success(offset, value);
    }
  };

  Tokenizer.prototype.If = function(chunk) {
    var block, error, ifElse, match, offset, start, test, value;
    if (!(match = IF.exec(chunk))) return NoMatch;
    start = match[0].length - 1;
    chunk = chunk.slice(start);
    test = this.Group(chunk);
    if (!test || test.error) {
      offset = start;
      error = 'malformed if condition';
      return failure(offset, error, test);
    }
    chunk = chunk.slice(test.offset);
    block = this.Block(chunk);
    if (!block || block.error) {
      offset = start + test.offset;
      error = 'malformed if block';
      return failure(offset, error, block);
    }
    chunk = chunk.slice(block.offset);
    ifElse = this.Else(chunk);
    if (!ifElse) {
      offset = start + test.offset + block.offset;
      value = new If(test.get(), block.get());
      return success(offset, value);
    }
    if (ifElse.error) {
      offset = start + test.offset + block.offset + ifElse.offset;
      error = ifElse.error;
      return failure(offset, error, ifElse);
    }
    offset = start + test.offset + block.offset + ifElse.offset;
    value = new If(test.get(), block.get(), ifElse.get());
    return success(offset, value);
  };

  Tokenizer.prototype.For = function(chunk) {
    var block, error, match, offset, start, test, value;
    if (!(match = FOR.exec(chunk))) return NoMatch;
    start = match[0].length - 1;
    chunk = chunk.slice(start);
    test = this.Group(chunk);
    if (!test || test.error) {
      offset = start;
      error = 'malformed for condition';
      return failure(offset, error, test);
    }
    chunk = chunk.slice(test.offset);
    block = this.Block(chunk);
    if (!block || block.error) {
      offset = start + test.offset;
      error = 'malformed while block';
      return failure(offset, error, block);
    }
    offset = start + test.offset + block.offset;
    value = new For(test.get(), block.get());
    return success(offset, value);
  };

  Tokenizer.prototype.While = function(chunk) {
    var block, error, match, offset, start, test, value;
    if (!(match = WHILE.exec(chunk))) return NoMatch;
    start = match[0].length - 1;
    chunk = chunk.slice(start);
    test = this.Group(chunk);
    if (!test || test.error) {
      offset = start;
      error = 'malformed while condition';
      return failure(offset, error, test);
    }
    chunk = chunk.slice(test.offset);
    block = this.Block(chunk);
    if (!block || block.error) {
      offset = start + test.offset;
      error = 'malformed while block';
      return failure(offset, error, block);
    }
    offset = start + test.offset + block.offset;
    value = new While(test.get(), block.get());
    return success(offset, value);
  };

  Tokenizer.prototype.DoWhile = function(chunk) {
    var block, error, match, offset, start, test, value, whileMatch, whileStart;
    if (!(match = DO.exec(chunk))) return NoMatch;
    start = match[0].length - 1;
    chunk = chunk.slice(start);
    block = this.Block(chunk);
    if (!block || block.error) {
      offset = start;
      error = 'malformed do block';
      return failure(offset, error, block);
    }
    chunk = chunk.slice(block.offset);
    test = (whileMatch = DO_WHILE.exec(chunk)) ? (whileStart = whileMatch[0].length - 1, chunk = chunk.slice(whileStart), this.Group(chunk)) : NoMatch;
    if (!test || test.error) {
      offset = start + block.offset;
      error = 'malformed do while condition';
      return failure(offset, error, test);
    }
    offset = start + block.offset + whileStart + test.offset;
    value = new DoWhile(block.get(), test.get());
    return success(offset, value);
  };

  Tokenizer.prototype.Func = function(chunk) {
    var args, block, error, match, name, offset, start, value;
    if (!(match = FUNC.exec(chunk))) return NoMatch;
    start = match[0].length - 1;
    name = match[1];
    chunk = chunk.slice(start);
    args = this.Group(chunk);
    if (!args || args.error) {
      offset = start;
      error = 'malformed function arguments';
      return failure(offset, error, args);
    }
    chunk = chunk.slice(args.offset);
    block = this.Block(chunk);
    if (!block || block.error) {
      offset = start + args.offset;
      error = 'malformed function block';
      return failure(offset, error, block);
    }
    offset = start + args.offset + block.offset;
    value = new Func(name, args.get(), block.get());
    return success(offset, value);
  };

  Tokenizer.prototype.Value = function(chunk) {
    var error, match, offset, result, start, value;
    if (!(match = IDENTIFIER.exec(chunk))) return NoMatch;
    start = match[0].length;
    chunk = chunk.slice(start);
    result = this.Member(chunk) || this.Access(chunk) || this.Invoke(chunk);
    if (!result) {
      offset = start;
      value = new Value(match[0]);
      return success(offset, value);
    } else if (result.failure) {
      offset = start;
      error = 'malformed value';
      return failure(offset, error, result);
    } else {
      offset = start + result.offset;
      value = new Value(match[0], result.get());
      return success(offset, value);
    }
  };

  Tokenizer.prototype.Member = function(chunk) {
    var error, match, offset, result, start, value;
    if (!(match = MEMBER.exec(chunk))) return NoMatch;
    start = match[0].length;
    chunk = chunk.slice(start);
    result = this.Value(chunk);
    if (!result || result.failure) {
      offset = start;
      error = 'malformed member access';
      return failure(offset, error, result);
    }
    offset = start + result.offset;
    value = new Member(result.get());
    return success(offset, value);
  };

  Tokenizer.prototype.Access = function(chunk) {
    var end, error, match, offset, results, start, value;
    if (!(match = ACCESS.exec(chunk))) return NoMatch;
    start = match[0].length - 1;
    chunk = chunk.slice(start);
    end = this.pair(chunk, '[', ']');
    if (!end) {
      offset = start;
      error = 'malformed array access';
      return failure(offset, error);
    }
    results = this.replace(chunk.slice(start + 1, (end - 1)), 'function', this.Function.bind(this));
    offset = start + end;
    value = new Access(results);
    return success(offset, value);
  };

  Tokenizer.prototype.Invoke = function(chunk) {
    var end, error, match, offset, results, start, value;
    if (!(match = INVOKE.exec(chunk))) return NoMatch;
    start = match[0].length - 1;
    chunk = chunk.slice(start);
    end = this.pair(chunk, '(', ')');
    if (!end) {
      offset = start;
      error = 'malformed group';
      return failure(offset, error);
    }
    results = this.replace(chunk.slice(start + 1, (end - 1)), 'function', this.Func.bind(this));
    offset = start + end;
    value = new Invoke(results);
    return success(offset, value);
  };

  return Tokenizer;

})();