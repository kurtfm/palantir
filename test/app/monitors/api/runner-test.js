'use strict';
const nock = require('nock');
const glob = require('glob');
const fs = require("fs");
require('mocha-generators').install();
const chai = require('chai');
const expect = chai.expect; // jshint ignore:line
const should = chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var config = require('../../../../config/load');
const app = config.application_root + config.api_monitor;
const runTests = require(app + 'runner');
	
describe('Runner Tests', function() {
	var data;
	before(function(done){
		config.target = 'onetest';
		runTests(config)
			.then(function(results){
				data = results;
				done();
			});

		var onetestFake = nock('http://localhost:33688')
	            .post('/one')
	            .reply(200, '');
	});

	after(function(){
		glob(config.application_root + config.output_folder + '*-*', function (er, files) {
		  for (var i = files.length - 1; i >= 0; i--) {
		  	fs.unlink(files[i]);
		  }
		});
	});
				
	it('should run tests and return something', function() {
		expect(data).to.not.be.undefined;
	});
	it('should run tests and return data with target that matches the one passed in', function*() {
		expect(data.target).to.equal(config.target);
	});
	it('should run tests and return id', function*() {
		expect(data.id).to.not.be.undefined;
	});
	it('should run tests and return outputFolder', function*() {
		expect(data.outputFolder).to.not.be.undefined;
	});
	it('should run tests and return htmlSummary', function*() {
		expect(data.htmlSummary).to.not.be.undefined;
	});
	it('should run tests and return xmlSummary', function*() {
		expect(data.xmlSummary).to.not.be.undefined;
	});
	it('should run tests and return jsonReport', function*() {
		expect(data.jsonReport).to.not.be.undefined;
	});
	it('should run tests and return debugLog', function*() {
		expect(data.debugLog).to.not.be.undefined;
	});

	it('should take an invalid target and throw and exception', function() {
		config.target = 'bogus';
		expect(function(){runTests(config)}).to.throw("AssertionError: The API you pass in must be setup to run with this monitor.");

	});
	it('should fail with missing test file', function*() {
		config.target = 'badtest';
		return runTests(config).catch(
			function(error){
				expect(error.name).to.equal("AssertionError");
				expect(error.message).to.contain("Could not find test file");
			});
	});

});