const expect = require('chai').expect;
const session = require('supertest-session');
const sinon = require('sinon');
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
let sandbox = null;

describe('Class instantiation', () => {
  afterEach((done) => {
    qps = null;
    done();
  });

  it('should initialize options variable.', (done) => {
    qps = new QlikSession(options, profile);
    expect(qps.options.host).to.be.equal(options.host);
    expect(qps.options.port).to.be.equal(options.port);
    expect(qps.options.passphrase).to.be.equal(options.passphrase);
    done();
  });
  it('should add / when prefix has no leading /.', (done) => {
    const modOptions = options;
    modOptions.prefix = 'portal';
    qps = new QlikSession(modOptions, profile);
    expect(qps.path.get.substring(0, 20)).to.be.equal('/qps/portal/session/');
    done();
  });
  it('should remove trailing / of prefix.', (done) => {
    options.prefix = '/portal/';
    qps = new QlikSession(options, profile);
    expect(qps.path.get.substring(0, 20)).to.be.equal('/qps/portal/session/');
    options.prefix = '/portal';
    done();
  });
  it('should set default values when option items are missing.', (done) => {
    const emptyOptions = {};
    qps = new QlikSession(emptyOptions, profile);
    expect(qps.options.host).to.be.equal('localhost');
    expect(qps.options.port).to.be.equal(4243);
    expect(qps.options.passphrase).to.be.equal('');
    done();
  });
  it('should return error when the path set in pfx does not exist.', (done) => {
    options.pfx = 'C:\\not_found.pfx';
    try {
      qps = new QlikSession(options, profile);
    } catch (e) {
      expect(JSON.stringify(e)).to.be.equal('{"errno":-4058,"code":"ENOENT","syscall":"open","path":"C:\\\\not_found.pfx"}');
    } finally {
      options.pfx = 'C:\\Cert\\client.pfx';
    }
    done();
  });
  it('should initialize profile variable.', (done) => {
    qps = new QlikSession(options, profile);
    expect(qps.profile).to.be.equal(profile);
    done();
  });
  it('should return error when profile items are missing.', (done) => {
    const emptyProfile = {};
    try {
      qps = new QlikSession(options, emptyProfile);
    } catch (e) {
      expect(e.toString()).to.be.equal('Error: profile.userDirectory is missing.');
    }
    done();
  });
  it('should initialize path variable.', (done) => {
    qps = new QlikSession(options, profile);
    expect(qps.path.get.substring(0, 20)).to.be.equal('/qps/portal/session/');
    expect(qps.path.delete.substring(0, 20)).to.be.equal('/qps/portal/session/');
    expect(qps.path.add.substring(0, 20)).to.be.equal('/qps/portal/session/');
    done();
  });
  it('should initialize jsonrequest variable.', (done) => {
    qps = new QlikSession(options, profile);
    const jsonrequest = JSON.parse(qps.jsonrequest);
    expect(jsonrequest.UserDirectory).to.be.equal(profile.userDirectory);
    expect(jsonrequest.UserId).to.be.equal(profile.userId);
    expect(jsonrequest.SessionId).to.not.be.null;
    done();
  });
  it('should initialize isSecure variable.', (done) => {
    qps = new QlikSession(options, profile);
    expect(qps.isSecure).to.be.equal(options.isSecure);
    done();
  });
  it('should ', (done) => {
    done();
  });
});

describe('formatPrefix', () => {
  beforeEach((done) => {
    qps = new QlikSession(options, profile);
    done();
  });
  afterEach((done) => {
    qps = null;
    done();
  });
  it('should return true', (done) => {
    const res = qps.formatPrefix('portal');
    expect(res).to.be.equal('/portal');
    done();
  });
  it('should return false', (done) => {
    const res = qps.formatPrefix('/portal/');
    expect(res).to.be.equal('/portal');
    done();
  });
});

describe('isStringValidJsonFormat', () => {
  const validJsonFormat = '{"UserDirectory": "portal","UserId": "john_doe","Attributes": [],"SessionId": "aaaaaaaaaaaaaaab","NewUser": true}';
  const invalidJsonFormat = 'SessionId &#39;aaaaaaaaaaaaaaab&#39; already exists! (405)';

  beforeEach((done) => {
    qps = new QlikSession(options, profile);
    done();
  });
  afterEach((done) => {
    qps = null;
    done();
  });
  it('should return true', (done) => {
    const res = qps.isStringValidJsonFormat(validJsonFormat);
    expect(res).to.be.true;
    done();
  });
  it('should return false', (done) => {
    const res = qps.isStringValidJsonFormat(invalidJsonFormat);
    expect(res).to.be.false;
    done();
  });
});

describe('hasValidUserInfo', () => {
  const jsonData = '{"UserDirectory": "portal","UserId": "john_doe","Attributes": [],"SessionId": "aaaaaaaaaaaaaaab","NewUser": true}';
  beforeEach((done) => {
    qps = new QlikSession(options, profile);
    done();
  });
  afterEach((done) => {
    qps = null;
    done();
  });
  it('should return true', (done) => {
    const res = qps.hasValidUserInfo(JSON.parse(jsonData));
    expect(res).to.be.true;
    done();
  });
  it('should return false', (done) => {
    var modifiedJsonData = JSON.parse(jsonData);
    modifiedJsonData.UserId = 'changeduser';
    const res = qps.hasValidUserInfo(modifiedJsonData);
    expect(res).to.be.false;
    done();
  });
});

describe('getSession', () => {
  beforeEach((done) => {
    qps = new QlikSession(options, profile);
    sandbox = sinon.sandbox.create();
    done();
  });
  afterEach((done) => {
    qps = null;
    sandbox.restore();
    done();
  });
  it('should ', (done) => {
    const qpsMock = sandbox.mock(qps).expects('sendRequest').withArgs('GET', qps.path.get);
    qps.getSession();
    qpsMock.verify();
    done();
  });
});

describe('addSession', () => {
  beforeEach((done) => {
    qps = new QlikSession(options, profile);
    sandbox = sinon.sandbox.create();
    done();
  });
  afterEach((done) => {
    qps = null;
    sandbox.restore();
    done();
  });
  it('should ', (done) => {
    const qpsMock = sandbox.mock(qps).expects('sendRequest').withArgs('POST', qps.path.add);
    qps.addSession();
    qpsMock.verify();
    done();
  });
});

describe('deleteSession', () => {
  beforeEach((done) => {
    qps = new QlikSession(options, profile);
    sandbox = sinon.sandbox.create();
    done();
  });
  afterEach((done) => {
    qps = null;
    sandbox.restore();
    done();
  });
  it('should ', (done) => {
    const qpsMock = sandbox.mock(qps).expects('sendRequest').withArgs('DELETE', qps.path.delete);
    qps.deleteSession();
    qpsMock.verify();
    done();
  });
});
