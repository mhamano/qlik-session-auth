const expect = require('chai').expect;
const session = require('supertest-session');
const QlikSession = require('../index.js');
const uuid = require('node-uuid');

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

// Config for test user
const profile = {
  userDirectory: 'portal',
  userId: 'john_doe',
  sessionId: uuid.v4(), // e.g. 32a4fbed-676d-47f9-a321-cb2f267e2918
};

let qps = null;

describe('Qlik Sense session auth test', () => {
  beforeEach((done) => {
    qps = new QlikSession(options, profile);
    done();
  });

  it('should fail to get session id with no session id error', (done) => {
    qps.getSession().then(() => {
      done('Passed the fail test.');
    },
    (res) => {
      expect(res).to.include('No session with id');
      done();
    });
  });

  it('should fail to delete session id with no session id error', (done) => {
    qps.deleteSession().then(() => {
      done('Passed the fail test.');
    },
    (res) => {
      expect(res).to.include('No session with id');
      done();
    });
  });
});
