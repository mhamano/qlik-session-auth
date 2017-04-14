const http = require('http');
const https = require('https');
const fs = require('fs');

module.exports = class QlikSession {

  /**
   * constructor - QlikSession Constructor
   *
   * @param {Object} options { host: String, port: Number, prefix: String,xrfkey: String,
   *                           pfx: String, passphrase: String, isSecure: Boolean },
   * @param {Objet} profile {userDirectory: String, userId: String, sessionId: String}
   *
   * @return {Object} QlikSession Instance
   */
  constructor(options, profile) {
    const prefix = QlikSession.formatPrefix(options.prefix) || '';
    const xrfkey = options.xrfkey || 'abcdefghijklmnop';
    const _pfx = options.pfx || 'C:\\Cert\\client.pfx';

    if (profile.userDirectory == null || profile.userDirectory === undefined) {
      throw new Error('profile.userDirectory is missing.');
    } else if (profile.userId == null || profile.userId === undefined) {
      throw new Error('profile.userId is missing.');
    } else if (profile.sessionId == null || profile.sessionId === undefined) {
      throw new Error('profile.userId is missing.');
    }

    this.options = {
      host: options.host || 'localhost',
      port: options.port || 4243,
      headers: { 'X-qlik-xrfkey': options.xrfkey, 'Content-Type': 'application/json' },
      pfx: fs.readFileSync(_pfx),
      passphrase: options.passphrase || '',
      rejectUnauthorized: false,
      agent: false,
    };

    this.path = {
      get: `/qps${prefix}/session/${profile.sessionId}?xrfkey=${xrfkey}`,
      delete: `/qps${prefix}/session/${profile.sessionId}?xrfkey=${xrfkey}`,
      add: `/qps${prefix}/session/?xrfkey=${xrfkey}`,
    };

    this.jsonrequest = JSON.stringify({
      UserDirectory: profile.userDirectory,
      UserId: profile.userId,
      SessionId: profile.sessionId,
    });

    this.profile = profile;
    this.isSecure = options.isSecure || 'true';
  }


  /**
   * @static formatPrefix - format prefix with leading '/' and withoug trailing '/'
   *
   * @param {String} prefix prefix used for Qlik Sense Virtual Proxy
   *
   * @return {String} formated prefix
   */
  static formatPrefix(prefix) {
    let _prefix = prefix;
    if (_prefix == null || _prefix === '' || _prefix === undefined) {
      return '';
    }
    if (_prefix.substring(0, 1) !== '/') {
      _prefix = `/${prefix}`;
    }
    if (prefix.substr(-1, 1) === '/') {
      _prefix = _prefix.substring(0, _prefix.length - 1);
    }
    return _prefix;
  }


  /**
   * @static isStringValidJsonFormat - check if input string is valid JSON format
   *  with UserDirectory, UserId, Attributes and SessionId.
   *
   * @param {String} str Stringified JSON string
   *
   * @return {Boolean} Valid JSON format = true, invalid = false
   */
  static isStringValidJsonFormat(str) {
    const reg = new RegExp(/^{.*"UserDirectory":.*"UserId":.*"Attributes":.*"SessionId":.*}$/);
    return reg.test(str);
  }


  /**
   * hasValidUserInfo - check if json includes valid user info
   *
   * @param {Object} json JSON data
   *
   * @return {Boolean} JSON includes valid userDirectory and userID = true, not includes = false
   */
  hasValidUserInfo(json) {
    const userDirectory = json.UserDirectory || json.Session.UserDirectory;
    const userId = json.UserId || json.Session.UserId;
    return userDirectory.toUpperCase() === this.profile.userDirectory.toUpperCase() &&
           userId.toUpperCase() === this.profile.userId.toUpperCase();
  }


  /**
   * sendRequest - send http request to Qlik Sense session API
   *
   * @param {String} method http method of 'GET', 'POST' or 'DELETE'
   * @param {String} path   path of Qlik Sense API endpoint
   *
   * @return {Object} Promise object
   */
  sendRequest(method, path) {
    this.options.method = method;
    this.options.path = path;
    const promise = new Promise((resolve, reject) => {
      const protocol = this.isSecure ? https : http;
      const sessionReq = protocol.request(this.options, (sessionRes) => {
        sessionRes.on('data', (d) => {
          if (QlikSession.isStringValidJsonFormat(d.toString())) {
            const session = JSON.parse(d.toString());
            if (this.hasValidUserInfo(session)) {
              resolve(session);
            } else {
              reject(`Error occured: ${d.toString()}`);
            }
          } else {
            reject(`Error occured: ${d.toString()}`);
          }
        });
      });
      sessionReq.write(this.jsonrequest);
      sessionReq.end();
      sessionReq.on('error', (err) => {
        reject(err);
      });
    });
    return promise;
  }

  /**
   * getSession - get Qlik Sense Session
   *
   * @return {Object} Promise object returned from sendRequest()
   */
  getSession() {
    return this.sendRequest('GET', this.path.get);
  }

  /**
   * deleteSession - delete Qlik Sense Session
   *
   * @return {Object} Promise object returned from sendRequest()
   */
  deleteSession() {
    return this.sendRequest('DELETE', this.path.delete);
  }

  /**
   * addSession - add new Qlik Sense Session
   *
   * @return {Object} Promise object returned from sendRequest()
   */
  addSession() {
    return this.sendRequest('POST', this.path.add);
  }
};
