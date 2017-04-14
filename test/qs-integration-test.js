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

describe('Qlik Sense session auth fail test', () => {
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

describe('Qlik Sense session auth test', () => {
  before((done) => {
    qps = new QlikSession(options, profile);
    done();
  });

  after((done) => {
    qps = null;
    done();
  });

  it('should add session id.', (done) => {
    qps.addSession().then((res) => {
      expect(res.UserDirectory.toUpperCase()).to.be.equal(profile.userDirectory.toUpperCase());
      expect(res.UserId.toUpperCase()).to.be.equal(profile.userId.toUpperCase());
      done();
    },
    (err) => {
      done(err);
    });
  });

  it('should get session.', (done) => {
    qps.getSession().then((res) => {
      expect(res.UserDirectory.toUpperCase()).to.be.equal(profile.userDirectory.toUpperCase());
      expect(res.UserId.toUpperCase()).to.be.equal(profile.userId.toUpperCase());
      done();
    },
    (err) => {
      done(err);
    });
  });

  it('should delete session.', (done) => {
    qps.deleteSession().then((res) => {
      expect(res.Session.UserDirectory.toUpperCase())
        .to.be.equal(profile.userDirectory.toUpperCase());
      expect(res.Session.UserId.toUpperCase()).to.be.equal(profile.userId.toUpperCase());
      done();
    },
    (err) => {
      done(err);
    });
  });
});
