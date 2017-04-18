# qlik-session-auth [![Build Status](https://travis-ci.org/mhamano/qlik-session-auth.svg?branch=master)](https://travis-ci.org/mhamano/qlik-session-auth)
Qlik Sense Session API authentication module for Node.js.

# Prerequisite
* Qlik Sense server and node.js server are installed on the same machine, or they are hosted on two servers accessible by FQDN under a single domain.

  ex) qs01.mydomain.com (Qlik Sense server) and portal.mydomain.com (Node.js server)

* Tested with Qlik Sense v3.2SR2 and Node v6.10.1.

# Installation and Setup
## Node.js
Create a node.js project and onstall qlik-session-auth package

`npm install --save qlik-session-auth `

Load qlik-session-auth and express-session module

    // Load qlik-session-auth module
    var QlikSession = require('qlik-session-auth');

    // Load express-session to store session data
    var session = require('express-session');

Setup to store cookie based session. The key needs to be the as the session cookie header name on Qlik Sense which will be setup later. When Qlik Sense server and node.js server are hosted on separated servers, domain needs to be added in the cookie setting.

    app.use(cookieParser('4803fd7c4e75c048dab014adacc9b22e665785ef'));

    app.use(session({
      secret: '4803fd7c4e75c048dab014adacc9b22e665785ef',
      key: 'X-Qlik-Session-portal',
      resave: false,
      saveUninitialized: true,
      cookie: { domain: '.mydomain.com' },
    }));

Define config options for Qlik Sense Session API and profile of login user.

    // Config for Qlik Sense Session API
    const options = {
      host: 'qs02.mydomain.com',
      port: 4243,
      prefix: '/portal',
      xrfkey: 'abcdefghijklmnop',
      pfx: 'C:\\Cert\\client.pfx',
      passphrase: '',
      isSecure: true,
    };

    // Config for login user
    const profile = {
      userDirectory: 'portal',
      userId: 'john_doe',
      sessionId: uuid.v4(), // e.g. 32a4fbed-676d-47f9-a321-cb2f267e2918
    };

Initialize QlikSession instance with options and profile and call addSession method.

    var qps = new QlikSession(options, profile);

    qps.addSession().then(
      function(res){
        console.log(res)
      },
      function(err){
        console.log(err);
    });

When you get or delete QlikSession, call the following methods.

    qps.getSession().then(....)

    qps.deleteSession().then(....)

## Qlik Sense
* Open 4243 port for QPS API as well as 80/443 ports for user access.

* Create a new virtual proxy for session authentication. Here is a sample configuration:

  * Description/Prefix - portal
  * Session cookie header name - X-Qlik-Session-portal (The same name as the session key on the node.js)
  * Authentication method - Ticket
  * Authentication module redirect URI - http://qs01.mydomain.com
  * Load balancing nodes - Central


* Add "Access-Control-Allow-Origin:*" to "Additional response headers" on the virtual proxy settings.

    https://community.qlik.com/thread/185385

* Add the domain name to "Host white list" on the virtual proxy settings.
  ex) mydomain.com

    https://community.qlik.com/thread/166842

## Author

**Masaki Hamano**
* http://github.com/mhamano

## Change Log

See [CHANGELOG](CHANGELOG.yml)

## License & Copyright
The software is made available "AS IS" without any warranty of any kind under the MIT License (MIT).

See [Additional license information for this solution.](LICENSE.md)
