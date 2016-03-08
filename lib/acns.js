(function() {
  'use strict';

  var _ = require('lodash'),
      events = require('events'),
      parseXmlString = require('xml2js').parseString,
      extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
      hasProp = {}.hasOwnProperty,
      bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
      validator = require('validator');

  exports.Parser = (function(superClass) {
    extend(Parser, superClass);

    function Parser() {
      this.parseString = bind(this.parseString, this);
    }

    Parser.prototype.extractXml = function(str) {
      var arrayOfLines = str.match(/[^\r\n]+/g);
      str = '';

      _(arrayOfLines).forEach(function(value) {
        if ((!value.match(/.*Content.*|.*Creation.*|\t|--|FLAGS|FETCH/i)) && value != '') {
          str += value;
        }
      });

      if (validator.isBase64(str)) {
        var b = new Buffer(str, 'base64');
        str = b.toString('utf8');
      }

      var re = /(\<\?xml.+\<\/Infringement\>)/ig;
      var m;
      str = str.replace(/\=\r\n/g, '')
               .replace(/\r\n/g, '')
               .replace(/\=3D/g, '=');

      if ((m = re.exec(str)) !== null) {
        if (m.index === re.lastIndex) {
            re.lastIndex++;
        }
        return m[0];
      }
    };

    Parser.prototype.parseString = function(str, cb) {
      if ((cb != null) && typeof cb === 'function') {
        this.on('end', function(result) {
          return cb(null, result);
        });
        this.on('error', function(err) {
          return cb(err);
        });
      }
      try {
        str = str.toString();

        var self = this;
        if (str.trim() === '') {
          this.emit('end', null);
          return true;
        }
        parseXmlString(this.extractXml(str), function(err, result) {
          if (err) {
            self.emit('error', err);
            return true;
          }
          self.emit('end', result);
          return true;
        });
      } catch (err) {
        self.emit('error', err);
        return true;
      }
    };

    return Parser;
  })(events.EventEmitter);

  exports.parseString = function(str, a) {
    var cb, parser;

    if (typeof a === 'function') {
      cb = a;
    }
    parser = new exports.Parser();
    return parser.parseString(str, cb);
  };
}).call(this);
