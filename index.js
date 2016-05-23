"use strict";

const gutil = require('gulp-util');
const exec = require('child_process').exec;
const fs = require('fs');
const argv = require('yargs').argv;

const PLUGIN_NAME = 'gulp-codedeploy';


class GulpCodeDeploy {

  /**
   * Constructor method
   *
   * @param   {object}  options  - The options object that is created during plugin instantiation
   */
  constructor(options) {
    if (!options) {
      throw new gutil.PluginError(PLUGIN_NAME, 'Missing options');
    }

    this.options = options;
  }

  /**
   * Getter method for options
   *
   * @returns   {object}      - The options object
   */
  get getOptions() {
    return this.options;
  }


  /**
   * Retrieves the eTag from response text sent from AWS after a push
   *
   * @param   {string} input  - The response string that is received after executing an upload
   * @returns {string}        - The eTag value
   */
  getTag(input) {
    // eTag="8ba1946a3a15fa95566af19328577710"
    return new RegExp(/eTag="([^"]*)"/g).exec(input)[1];
  }

  /**
   * Retrieves the deployment-id from response text sent from AWS after a deployment
   * since this string is JSON formatted
   * [1] Parse into JSON
   * [2] return the value *magic*
   *
   * @param   {string} input  - The response string
   * @returns {string}        - The deployment id
   */
  static getDeploymentId(input) {
    // { "deploymentId": "d-VFY9K81UF" }
    let id = JSON.parse(input); // [1]
    return id.deploymentId; // [2]
  }

  /**
   * Crafts the command as an array, then converts to a string and returns it
   * 
   * @returns {string}        - The command string
   */
  createPushExecutableString() {
    return [
      `aws deploy push`,
      `--application-name ${this.options.appName}`,
      `--s3-location s3://${this.options.bucket}/${this.options.subdir}/${this.options.fileName}`,
      `--description "${this.options.defaultDescription}"`,
      `--source ${this.options.source}`
    ].join(' ');
  }

  /**
   * Takes the response from the push execution and replaces
   *  <deployment-group-name>
   *  <deployment-config-name>
   *  <description>
   * with data from the options object. Then returns the string.
   *
   * @param   {string}  response  - A string that is sent from AWS after the `push` command is executed
   * @returns {string}            - The command string
   */
  createDeployExecutableString(response) {
    if (!response) {
      throw new gutil.PluginError(PLUGIN_NAME, 'Missing arguments in createDeployExecutableString method');
    }

    let base = response.replace(/<deployment-group-name>/g, this.options.deploymentGroup);
    base = base.replace(/<deployment-config-name>/g, this.options.deployConfig);
    base = base.replace(/<description>/g, `"${this.options.defaultDescription}"`);
    return base;
  }
}

module.exports = GulpCodeDeploy;
