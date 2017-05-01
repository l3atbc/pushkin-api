/*eslint-env mocha */
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const request = require("supertest");
const chai = require("chai");
const sinon = require("sinon");

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
describe("WHICH English Controller", () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(bodyParser.json());
    app.use(cors());

    app.use((req, resp, next) => {
      req.test = "connect";
      next();
    });
    app.use((err, req, res, next) => {
      res.status(500);
      console.log("error!!!", err);
      res.json({ error: err.message });
    });
  });

  describe("GET /api/initialQuestions", function() {
    it("respond with json", function() {
      const mockResponse = {
        questions: [{ id: 1 }, { id: 2 }]
      };
      let mockRpc = sinon.stub().returns(Promise.resolve(mockResponse));

      const whichEnglishController = require("../controllers/whichEnglish")(
        mockRpc,
        "fake connection"
      );
      app.use("/", whichEnglishController);
      return request(app)
        .get("/api/initialQuestions")
        .set("Accept", "application/json")
        .expect(200)
        .expect("Content-Type", /json/)
        .then(response => {
          const expectedChannel = "db_rpc_worker";
          const connection = "fake connection";
          const body = {
            method: "getInitialQuestions"
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
    describe("GET /api/responses", () => {
      it("should call rpc with allResponses", () => {
        const mockResponse = {
          responses: ["response 1"]
        };
        let mockRpc = sinon.stub().returns(Promise.resolve(mockResponse));
        const whichEnglishController = require("../controllers/whichEnglish")(
          mockRpc,
          "fake connection"
        );
        app.use("/", whichEnglishController);
        return request(app)
          .get("/api/responses")
          .set("Accept", "application/json")
          .expect(200)
          .expect("Content-Type", /json/)
          .then(response => {
            const expectedChannel = "db_rpc_worker";
            const connection = "fake connection";
            const body = {
              method: "allResponses",
              arguments: []
            };
            const wasCalledWithArgs = mockRpc.calledWith(
              connection,
              expectedChannel,
              body
            );
            const rpcArguments = mockRpc.getCall(0).args;
            expect(rpcArguments).to.have.length(3);
            expect(rpcArguments[0]).to.eql("fake connection");
            expect(rpcArguments[1]).to.eql("db_rpc_worker");
            expect(rpcArguments[2]).to.eql({
              method: "allResponses",
              arguments: []
            });
            expect(wasCalledWithArgs).to.be.true;
            return response;
          })
          .then(response => {
            expect(response.body).to.eql(mockResponse);
          });
      });
      // it("should return 200");
      // it("should return json");
    });
  });
});
