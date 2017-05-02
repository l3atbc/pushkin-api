/*eslint-env mocha */
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const request = require('supertest');
const chai = require('chai');
const sinon = require('sinon');

const expect = chai.expect;

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

  describe('GET /api/initialQuestions', function() {
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
        .get('/api/initialQuestions')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .then(response => {
          const expectedChannel = 'db_rpc_worker';
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
    describe('GET /api/responses', () => {
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
          .get('/api/responses')
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .then(response => {
            const expectedChannel = 'db_rpc_worker';
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
            expect(rpcArguments[1]).to.eql('db_rpc_worker');
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
    describe('POST /api/response', () => {
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
          .post('/api/response')
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .send({ user: { id: 1 }, questionId: 1, choiceId: 1 })
          .expect(200)
          .then(response => {
            expect(mockDbWrite.called).to.be.true;
            const dbWriterArguments = mockDbWrite.firstCall.args;
            expect(dbWriterArguments).to.have.length(3);
            expect(dbWriterArguments[0]).to.eql('fake connection');
            expect(dbWriterArguments[1]).to.eql('db_write');
            expect(dbWriterArguments[2]).to.eql({
              method: 'createResponse',
              arguments: [{ userId: 1, choiceId: 1 }]
            });
            expect(
              mockDbWrite.calledWith('fake connection', 'db_write', {
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
          .post('/api/response')
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
    describe('PUT /api/users/:id', () => {
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
          .put(`/api/users/${userId}`)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .send({ age: 5, gender: 'female' })
          .expect(200)
          .then(() => {
            expect(mockRpc.calledOnce).to.be.true;
            expect(mockRpc.firstCall.args.length).to.equal(3);
            expect(mockRpc.firstCall.args[0]).to.equal('fake connection');
            expect(mockRpc.firstCall.args[1]).to.equal('db_rpc_worker');
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
          .put(`/api/users/${userId}`)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .send({ address: '555 heaven st.' })
          .expect(500)
          .then(response => {
            expect(response.body.error).to.equal(
              "user doesn't have an address"
            );
          });
      });
    });
    describe('GET /api/trials', () => {
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
        return request(app).get('/api/trials').expect(200).then(() => {
          expect(mockRpc.calledOnce).to.be.true;
          expect(mockRpc.firstCall.args.length).to.equal(3);
          expect(mockRpc.firstCall.args[0]).to.equal('fake connection');
          expect(mockRpc.firstCall.args[1]).to.equal('db_rpc_worker');
          expect(mockRpc.firstCall.args[2]).to.eql({
            method: 'allTrials'
          });
        });
      });
    });
  });
});
