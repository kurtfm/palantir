
'use strict';
const assert = require('assert');
const JSON5 = require('json5');
const fs = require('fs');
const Promise = require('bluebird');
const Newman = require('newman');
const _ = require('lodash');

module.exports = function(conf){
    const target = conf.target;
    const time = Date.now();
    const outputId = target + "." + time + "." +  (Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000);
    const newmanFolder = conf.application_root + conf.newman_folder + target + '-';
    const outputFolder = conf.application_root + conf.output_folder + outputId;

    assert.strictEqual(
        typeof target, 
        "string", 
        "Pass API environment when starting monitor example: API=brandapis-prod node bin/api-monitor.js")
    assert(
        _.includes(conf.supported_monitors,target), 
        "The API you pass in must be setup to run with this monitor.");

    return new Promise(function(resolve,reject){
        var jsonReport =  outputFolder + conf.report_file_end;
        var htmlSummary = outputFolder + conf.html_results_file_end;
        var debugLog = outputFolder +  conf.verbose_file_end;
        var xmlSummary = outputFolder +  conf.xml_results_file_end;
        var testFile = newmanFolder + conf.test_file;
        var envFile = newmanFolder + conf.env_file;
        var globalFile = newmanFolder + conf.global_file;


        function fileExists(path) {
          try  {
            return fs.statSync(path).isFile();
          }
          catch (e) {

            if (e.code == 'ENOENT') { 
              return false;
            }
            console.log("Exception fs.statSync (" + path + "): " + e);
            throw e;
          }
        }

        var tests = fileExists(testFile) ?
            JSON5.parse(fs.readFileSync( testFile, 'utf8')) : 
            assert(false, "Could not find test file: " + testFile);
        var environment = fileExists(envFile) ?
            JSON5.parse(fs.readFileSync( envFile, 'utf8')) : {};
        var globals = fileExists(globalFile) ?
            JSON5.parse(fs.readFileSync( globalFile, 'utf8')) : {};

        var newmanOptions = {
            envJson: environment,
            global: globals,
            responseHandler: "TestResponseHandler",
            asLibrary: true,
            stopOnError: false,
            outputFileVerbose: debugLog,
            html: htmlSummary,
            outputFile: jsonReport,
            testReportFile: xmlSummary,
            insecure: true,
            noSummary: true,
            noTestSymbols: true,
            noColor: true
        };

        Newman.execute(tests, newmanOptions,function(e){
            var testOptions = Newman.getOptions();
            if(e){
                reject(e);
            }
            else{
                resolve({
                    "target":target,
                    "id":outputId,
                    "outputFolder":conf.application_root + conf.output_folder,
                    "htmlSummary":htmlSummary,
                    "xmlSummary":xmlSummary,
                    "jsonReport":jsonReport,
                    "debugLog":debugLog}
                    );
            }
        });  
    });
  
};