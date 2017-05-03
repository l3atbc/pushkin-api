/*eslint-env mocha */
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const request = require('supertest');
const chai = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const expect = chai.expect;
const path = require('path');

// app.use(bodyParser.json());
// app.use(cors());

// app.use((req, resp, next) => {
//   req.test = "connect";
//   next();
// });
// app.use((err, req, res, next) => {
//   res.status(500);
//   console.log("error!!!", err);
//   res.json({ error: err.message });
// });
const errorHandler = (err, req, res, next) => {
  res.status(500);
  // console.log('error!!!', err);
  res.json({ error: err.message });
};
describe('WHICH English Controller', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(bodyParser.json());
    app.use(cors());

    app.use((req, resp, next) => {
      req.test = 'connect';
      next();
    });
  });

  describe('GET /initialQuestions', function() {
    it('respond with json', function() {
      const mockResponse = {
        questions: [{ id: 1 }, { id: 2 }]
      };
      let mockRpc = sinon.stub().returns(Promise.resolve(mockResponse));

      const whichEnglishController = require('../controllers/whichEnglish')(
        mockRpc,
        'fake connection'
      );
      app.use('/', whichEnglishController);
      app.use(errorHandler);
      return request(app)
        .get('/initialQuestions')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .then(response => {
          const expectedChannel = 'whichenglish_rpc_worker';
          const connection = 'fake connection';
          const body = {
            method: 'getInitialQuestions'
          };
          expect(mockRpc.getCalls()).to.have.length(1);
          const args = mockRpc.calledWith(connection, expectedChannel, body);
          expect(args).to.be.true;
          expect(mockRpc.called).to.be.true;
          return response;
        })
        .then(response => {
          expect(response.body).to.eql(mockResponse);
        });
    });
  });
  describe('GET /responses', () => {
    it('should call rpc with allResponses', () => {
      const mockResponse = {
        responses: ['response 1']
      };
      let mockRpc = sinon.stub().returns(Promise.resolve(mockResponse));
      const whichEnglishController = require('../controllers/whichEnglish')(
        mockRpc,
        'fake connection'
      );
      app.use('/', whichEnglishController);
      app.use(errorHandler);

      return request(app)
        .get('/responses')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .then(response => {
          const expectedChannel = 'whichenglish_rpc_worker';
          const connection = 'fake connection';
          const body = {
            method: 'allResponses',
            arguments: []
          };
          const wasCalledWithArgs = mockRpc.calledWith(
            connection,
            expectedChannel,
            body
          );
          const rpcArguments = mockRpc.firstCall.args;
          expect(rpcArguments).to.have.length(3);
          expect(rpcArguments[0]).to.eql('fake connection');
          expect(rpcArguments[1]).to.eql('whichenglish_rpc_worker');
          expect(rpcArguments[2]).to.eql({
            method: 'allResponses',
            arguments: []
          });
          expect(wasCalledWithArgs).to.be.true;
          return response;
        })
        .then(response => {
          expect(response.body).to.eql(mockResponse);
        });
    });
  });
  describe('POST /response', () => {
    it('should insert workerInput to DB write with the user Id and the Choice ID', () => {
      const mockResponse = {
        responses: ['response 1']
      };
      let mockRpc = sinon.stub().returns(Promise.resolve(mockResponse));
      let mockDbWrite = sinon.stub().returns(Promise.resolve());
      const whichEnglishController = require('../controllers/whichEnglish')(
        mockRpc,
        'fake connection',
        mockDbWrite
      );
      app.use('/', whichEnglishController);
      app.use(errorHandler);

      return request(app)
        .post('/response')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({ user: { id: 1 }, questionId: 1, choiceId: 1 })
        .expect(200)
        .then(response => {
          expect(mockDbWrite.called).to.be.true;
          const dbWriterArguments = mockDbWrite.firstCall.args;
          expect(dbWriterArguments).to.have.length(3);
          expect(dbWriterArguments[0]).to.eql('fake connection');
          expect(dbWriterArguments[1]).to.eql('whichenglish_db_write');
          expect(dbWriterArguments[2]).to.eql({
            method: 'createResponse',
            arguments: [{ userId: 1, choiceId: 1 }]
          });
          expect(
            mockDbWrite.calledWith('fake connection', 'whichenglish_db_write', {
              method: 'createResponse',
              arguments: [{ userId: 1, choiceId: 1 }]
            })
          ).to.be.true;
        });
    });
    it('should call rpc with createResponse and the passed in user, question and choice ID', () => {
      const mockResponse = {
        responses: ['response 1']
      };
      let mockRpc = sinon.stub().returns(Promise.resolve(mockResponse));
      let mockDbWrite = sinon.stub().returns(Promise.resolve());
      const whichEnglishController = require('../controllers/whichEnglish')(
        mockRpc,
        'fake connection',
        mockDbWrite
      );
      app.use('/', whichEnglishController);
      app.use(errorHandler);
      return request(app)
        .post('/response')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({ user: { id: 42 }, questionId: 100, choiceId: 1112 })
        .expect(200)
        .then(response => {
          const expectedChannel = 'task_queue';
          const connection = 'fake connection';
          const body = {
            method: 'getQuestion',
            payload: { userId: 42, questionId: 100, choiceId: 1112 }
          };
          const wasCalledWithArgs = mockRpc.calledWith(
            connection,
            expectedChannel,
            body
          );
          expect(mockDbWrite.called).to.be.true;
          expect(mockRpc.called).to.be.true;
          expect(mockRpc.firstCall.args.length).to.equal(3);
          expect(mockRpc.firstCall.args[0]).to.equal('fake connection');
          expect(mockRpc.firstCall.args[1]).to.equal('task_queue');
          expect(mockRpc.firstCall.args[2]).to.eql({
            method: 'getQuestion',
            payload: { userId: 42, questionId: 100, choiceId: 1112 }
          });

          expect(wasCalledWithArgs).to.be.true;
        });
    });
  });
  describe('PUT /users/:id', () => {
    it('should call rpc with updateUser and return updated user if successful', () => {
      let mockRpc = sinon.stub().returns(Promise.resolve());
      let mockDbWrite = sinon.stub().returns(Promise.resolve());
      const whichEnglishController = require('../controllers/whichEnglish')(
        mockRpc,
        'fake connection',
        mockDbWrite
      );
      app.use('/', whichEnglishController);
      app.use(errorHandler);
      const userId = '1';
      return request(app)
        .put(`/users/${userId}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({ age: 5, gender: 'female' })
        .expect(200)
        .then(() => {
          expect(mockRpc.calledOnce).to.be.true;
          expect(mockRpc.firstCall.args.length).to.equal(3);
          expect(mockRpc.firstCall.args[0]).to.equal('fake connection');
          expect(mockRpc.firstCall.args[1]).to.equal('whichenglish_rpc_worker');
          expect(mockRpc.firstCall.args[2]).to.eql({
            method: 'updateUser',
            arguments: [userId, { age: 5, gender: 'female' }]
          });
        });
    });
    it('should call rpc with updateUser and return an error if failed', () => {
      let mockRpc = sinon
        .stub()
        .throws(new Error("user doesn't have an address"));
      let mockDbWrite = sinon.stub().returns(Promise.resolve());
      const whichEnglishController = require('../controllers/whichEnglish')(
        mockRpc,
        'fake connection',
        mockDbWrite
      );
      const userId = '1';

      app.use('/', whichEnglishController);
      app.use(errorHandler);
      return request(app)
        .put(`/users/${userId}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({ address: '555 heaven st.' })
        .expect(500)
        .then(response => {
          expect(response.body.error).to.equal("user doesn't have an address");
        });
    });
  });
  describe('GET /trials', () => {
    it('should call rpc with allTrials and returns all trials if successful', () => {
      let mockRpc = sinon.stub().returns(Promise.resolve());
      let mockDbWrite = sinon.stub().returns(Promise.resolve());
      const whichEnglishController = require('../controllers/whichEnglish')(
        mockRpc,
        'fake connection',
        mockDbWrite
      );
      app.use('/', whichEnglishController);
      app.use(errorHandler);
      return request(app).get('/trials').expect(200).then(() => {
        expect(mockRpc.calledOnce).to.be.true;
        expect(mockRpc.firstCall.args.length).to.equal(3);
        expect(mockRpc.firstCall.args[0]).to.equal('fake connection');
        expect(mockRpc.firstCall.args[1]).to.equal('whichenglish_rpc_worker');
        expect(mockRpc.firstCall.args[2]).to.eql({
          method: 'allTrials'
        });
      });
    });
  });
  describe('GET /admincsv', () => {
    it('should return 401 if unauthorized', () => {
      let mockRpc = sinon.stub().returns(Promise.resolve());
      let mockDbWrite = sinon.stub().returns(Promise.resolve());
      const whichEnglishController = require('../controllers/whichEnglish')(
        mockRpc,
        'fake connection',
        mockDbWrite
      );
      app.use('/', whichEnglishController);
      app.use(errorHandler);
      return request(app).get('/admincsv').expect(401);
    });
    it('shoud call rpcInput with getResponseCSV if authorization successful', done => {
      return fs.readFile(
        path.resolve(__dirname + '/../admin.txt'),
        'utf-8',
        (err, data) => {
          if (err) {
            throw err;
          }
          const outputArray = data.split('\n');
          const user = {
            name: outputArray[0].split(':')[0],
            password: outputArray[0].split(':')[1]
          };
          let mockRpc = sinon.stub().returns(Promise.resolve());
          let mockDbWrite = sinon.stub().returns(Promise.resolve());
          const whichEnglishController = require('../controllers/whichEnglish')(
            mockRpc,
            'fake connection',
            mockDbWrite
          );
          app.use('/', whichEnglishController);
          app.use(errorHandler);
          return request(app)
            .get('/admincsv')
            .auth(user.name, user.password)
            .expect(200)
            .end(() => {
              expect(mockRpc.calledOnce).to.be.true;
              expect(mockRpc.firstCall.args).to.have.lengthOf(3);
              expect(mockRpc.firstCall.args[0]).to.equal('fake connection');
              expect(mockRpc.firstCall.args[1]).to.equal(
                'whichenglish_rpc_worker'
              );
              expect(mockRpc.firstCall.args[2]).to.eql({
                method: 'getResponseCsv'
              });
              done();
            });
        }
      );
    });
    it('shoudl return the result of the rpc call as CSV data', done => {
      return fs.readFile(
        path.resolve(__dirname + '/../admin.txt'),
        'utf-8',
        (err, data) => {
          if (err) {
            throw err;
          }
          const outputArray = data.split('\n');
          const user = {
            name: outputArray[0].split(':')[0],
            password: outputArray[0].split(':')[1]
          };
          let mockRpc = sinon.stub().returns(Promise.resolve('1,2,3\n4,5,6'));
          let mockDbWrite = sinon.stub().returns(Promise.resolve());
          const whichEnglishController = require('../controllers/whichEnglish')(
            mockRpc,
            'fake connection',
            mockDbWrite
          );
          app.use('/', whichEnglishController);
          app.use(errorHandler);
          return request(app)
            .get('/admincsv')
            .auth(user.name, user.password)
            .expect(200)
            .end((err, resp) => {
              if (err) {
                return done(err);
              }
              expect(mockRpc.calledOnce).to.be.true;
              expect(resp.header['content-type']).to.equal(
                'text/csv; charset=utf-8'
              );
              expect(resp.text).to.eql('1,2,3\n4,5,6');
              done();
            });
        }
      );
    });
  });
  describe('GET /languages', () => {
    it('should call rpc with allLanguages and return all languages when successful', () => {
      let mockRpc = sinon.stub().returns(Promise.resolve());
      let mockDbWrite = sinon.stub().returns(Promise.resolve());
      const whichEnglishController = require('../controllers/whichEnglish')(
        mockRpc,
        'fake connection',
        mockDbWrite
      );
      app.use('/', whichEnglishController);
      app.use(errorHandler);
      return request(app).get('/languages').expect(200).then(() => {
        expect(mockRpc.calledOnce).to.be.true;
        expect(mockRpc.firstCall.args).to.have.lengthOf(3);
        expect(mockRpc.firstCall.args[0]).to.equal('fake connection');
        expect(mockRpc.firstCall.args[1]).to.equal('whichenglish_rpc_worker');
        expect(mockRpc.firstCall.args[2]).to.eql({
          method: 'allLanguages'
        });
      });
    });
  });
  describe('GET /users/:id', () => {
    it('should call rpc with findUser and return user when successful', () => {
      let mockRpc = sinon.stub().returns(Promise.resolve('1,2,3\n4,5,6'));
      let mockDbWrite = sinon.stub().returns(Promise.resolve());
      const whichEnglishController = require('../controllers/whichEnglish')(
        mockRpc,
        'fake connection',
        mockDbWrite
      );
      const userId = '1';
      app.use('/', whichEnglishController);
      app.use(errorHandler);
      return request(app).get(`/users/${userId}`).expect(200).then(() => {
        expect(mockRpc.calledOnce).to.be.true;
        expect(mockRpc.firstCall.args).to.have.lengthOf(3);
        expect(mockRpc.firstCall.args[0]).to.equal('fake connection');
        expect(mockRpc.firstCall.args[1]).to.equal('whichenglish_rpc_worker');
        expect(mockRpc.firstCall.args[2]).to.eql({
          method: 'findUser',
          arguments: [userId, ['userLanguages.languages']]
        });
      });
    });
  });
  describe('Get /results/:userId', () => {
    it('should call rpc with getResults and return results for a user when successful', () => {
      let mockRpc = sinon.stub().returns(Promise.resolve());
      let mockDbWrite = sinon.stub().returns(Promise.resolve());
      const whichEnglishController = require('../controllers/whichEnglish')(
        mockRpc,
        'fake connection',
        mockDbWrite
      );
      const userId = '1';
      app.use('/', whichEnglishController);
      app.use(errorHandler);
      return request(app).get(`/results/${userId}`).expect(200).then(() => {
        expect(mockRpc.calledOnce).to.be.true;
        expect(mockRpc.firstCall.args).to.have.lengthOf(3);
        expect(mockRpc.firstCall.args).to.eql([
          'fake connection',
          'task_queue',
          {
            method: 'getResults',
            payload: {
              userId: userId
            }
          }
        ]);
      });
    });
  });
  describe('POST /comments', () => {
    it('should call rpc with setUserLanguages', () => {
      let mockRpc = sinon.stub().returns(Promise.resolve());
      let mockDbWrite = sinon.stub().returns(Promise.resolve());
      const whichEnglishController = require('../controllers/whichEnglish')(
        mockRpc,
        'fake connection',
        mockDbWrite
      );
      const userId = '1';
      app.use('/', whichEnglishController);
      app.use(errorHandler);
      return request(app)
        .post('/comments')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
          userId,
          nativeLanguages: ['chinese', 'english'],
          primaryLanguages: ['arbic', 'greek']
        })
        .expect(200)
        .then(() => {
          expect(mockRpc.calledTwice).to.be.true;
          expect(mockRpc.firstCall.args).to.eql([
            'fake connection',
            'whichenglish_rpc_worker',
            {
              method: 'setUserLanguages',
              arguments: [
                userId,
                {
                  nativeLanguages: ['chinese', 'english'],
                  primaryLanguages: ['arbic', 'greek']
                }
              ]
            }
          ]);
        });
    });
    it('should call rpc2 with updateUser', () => {
      let mockRpc = sinon.stub().returns(Promise.resolve());
      let mockDbWrite = sinon.stub().returns(Promise.resolve());
      const whichEnglishController = require('../controllers/whichEnglish')(
        mockRpc,
        'fake connection',
        mockDbWrite
      );
      const userId = '1';
      app.use('/', whichEnglishController);
      app.use(errorHandler);
      return request(app)
        .post('/comments')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
          userId,
          nativeLanguages: ['chinese', 'english'],
          primaryLanguages: ['arbic', 'greek'],
          countryOfResidence: ['china', 'usa'],
          englishYears: '2',
          householdEnglish: true,
          learnAge: '2'
        })
        .expect(200)
        .then(() => {
          expect(mockRpc.calledTwice).to.be.true;
          expect(mockRpc.secondCall.args).to.eql([
            'fake connection',
            'whichenglish_rpc_worker',
            {
              method: 'updateUser',
              arguments: [
                userId,
                {
                  countriesOfResidence: 'china,usa',
                  englishYears: '2',
                  householdEnglish: true,
                  learnAge: '2'
                }
              ]
            }
          ]);
        });
    });
    it('should return setUserLanguages && updateUser as one unified result obj', () => {
      let mockRpc = sinon.stub();
      mockRpc.onFirstCall().returns(Promise.resolve({ one: '1' }));
      mockRpc.onSecondCall().returns(Promise.resolve({ two: '2' }));
      let mockDbWrite = sinon.stub().returns(Promise.resolve());
      const whichEnglishController = require('../controllers/whichEnglish')(
        mockRpc,
        'fake connection',
        mockDbWrite
      );
      const userId = '1';
      app.use('/', whichEnglishController);
      app.use(errorHandler);
      return request(app)
        .post('/comments')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
          userId,
          nativeLanguages: ['chinese', 'english'],
          primaryLanguages: ['arbic', 'greek'],
          countryOfResidence: ['china', 'usa'],
          englishYears: '2',
          householdEnglish: true,
          learnAge: '2'
        })
        .expect(200)
        .then(response => {
          expect(mockRpc.calledTwice).to.be.true;
          expect(response.body).to.eql({ one: '1', two: '2' });
        });
    });
  });
});
