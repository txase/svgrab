#!/usr/bin/env node

var fs = require('fs');

var ArgumentParser = require('argparse').ArgumentParser;
var phantomjs = require('phantomjs').path;
var phantom = require('node-phantom');
var Seq = require('seq');

var parser = new ArgumentParser({
  addHelp: true,
  description: 'Tool to export an SVG element from a website to a file',
});

parser.addArgument(['-s', '--selector'], {help: 'jQuery selector for HTML SVG element', defaultValue: 'svg'});
parser.addArgument(['-o', '--output'], {help: 'File to save SVG to (defaults to stdout)'});
parser.addArgument(['-t', '--timeout'], {help: 'Timeout (in ms) to wait before grabbing SVG element', defaultValue: 0});
parser.addArgument(['site'], {help: 'Website to export SVG from', nargs: 1});
var args = parser.parseArgs();

Seq()
  .seq('phantom', function() {
    phantom.create(this, {phantomPath: phantomjs});
  })
  .seq('page', function(ph) {
    ph.createPage(this);
  })
  .seq('open', function(page) {
    page.open(args.site, this);
  })
  .seq('inject', function() {
    this.vars.page.injectJs('lib/innersvg.js');
    this.vars.page.injectJs('lib/jquery-2.0.3.min.js');
    this.ok();
  })
  .seq('wait', function() {
    setTimeout(this, args.timeout);
  })
  .par('svg', function() {
    this.vars.page.evaluate(function(selector) {
      var svg = $(selector);
      if (!svg.length)
        return new Error('No SVG found on page');

      var attrs = Array.prototype.slice.call(svg[0].attributes);

      attrs = attrs.map(function(attr) {
        return attr.nodeName + '="' + attr.nodeValue + '"';
      });
      
      var styles = '';
      var sheets = Array.prototype.slice.call(document.styleSheets);
      sheets.forEach(function(sheet) {
        var rules = Array.prototype.slice.call(sheet.cssRules);
        rules.forEach(function(rule) {
          styles += rule.cssText;
        });
      });

      return JSON.stringify({attrs: attrs, innerSVG: svg.html(), styles: styles});
    }, this, args.selector);
  })
  .seq('content', function(content) {
    if (typeof content === 'object') // It's an error!
      return this(new Error(content.message));

    content = JSON.parse(content);

    var string = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n';
    string += '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"';
    content.attrs.forEach(function(attr) {
      string += ' ' + attr;
    });
    string += '>\n';
    string += '<style>\n'
    string += content.styles + '\n';
    string += '</style>\n';
    string += content.innerSVG;
    string += '</svg>';

    if (args.output)
      fs.writeFileSync(args.output, string);
    else
      console.log(string);

    this.vars.phantom.exit();
  })
  ['catch'](function(err, stage) {
    console.error('Failed in stage ' + stage + ': ' + err.stack);
    this.vars.phantom.exit();
  });
