const express = require("express");
function initialQuestions(rpc, conn) {
  const router = new express.Router();
  router.get("/api/initialQuestions", (req, res, next) => {
    var rpcInput = {
      method: "getInitialQuestions"
    };
    const channelName = "db_rpc_worker";
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
    // create a channel
  });
  router.get("/api/responses", (req, res, next) => {
    console.log("in route");
    const { user, choiceId, questionId } = req.body;
    var rpcInput = {
      method: "allResponses",
      arguments: []
    };
    const channelName = "db_rpc_worker";
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  return router;
}

module.exports = initialQuestions;
