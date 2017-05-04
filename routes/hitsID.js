var HIT = require('../models/hit');
var constants = require('../config/constants');

var mongoose = require('mongoose');

module.exports = function(router) {

  // define the route as baseRoute + /hits
  var HITsIDRoute = router.route('/hits/:id');

  /*
  helper to initially check valid fields
  */
  function isValidHIT(body) {
      if (constants.isValid(body.numYes)
      && constants.isValid(body.numNo)
      && constants.isValid(body.numUncertain)
      && constants.isValid(body.numSource1)
      && constants.isValid(body.numSource2)
      && constants.isValid(body.numSourceOther)
      ) {
      return true;
  }
  return false;
};

  /*
  PUT to update HIT properties
  */
  HITsIDRoute.put(function(req, res, next) {
    var responseObj = new constants['responseObject']();
    // check fields
    if (!isValidHIT(req.body) || !req.params.id) {
      responseObj.status = constants.Error.status;
      responseObj.body.message = constants.Error.message;
      responseObj.body.data = {
        "params": {
          "id": "required"
        },
        "numYes":"required",
        "numNo": "required",
        "numUncertain": "required",
        "numSource1": "required",
        "numSource2": "required",
        "numSourceOther": "required"
      };
      next(responseObj);
    }
    else {
      var id = req.params.id;
      HIT.findOne({'_id': id}).exec()
        .then(function(result) {
          if (result === null) {
            throw 'HIT not found';
          }

          var toUpdate = result;
          toUpdate.numYes = req.body.numYes;
          toUpdate.numNo  = req.body.numNo;
          toUpdate.numUncertain = req.body.numUncertain;
          toUpdate.numSource1 = req.body.numSource1;
          toUpdate.numSource2 = req.body.numSource2;
          toUpdate.numSourceOther = req.body.numSourceOther;
          toUpdate.citationsYes = req.body.citationsYes ? req.body.citationsYes : toUpdate.citationsYes;
          toUpdate.citationsNo = req.body.citationsNo ? req.body.citationsNo : toUpdate.citationsNo;
          toUpdate.citationsUncertain = req.body.citationsUncertain ? req.body.citationsUncertain : toUpdate.citationsUncertain;

          toUpdate.save()
            .then(function(result) {
              res.status(constants.OK.status);
              responseObj.body.message = constants.OK.message;
              responseObj.body.data = result;
              res.send(responseObj.body);
            })
            .catch(function(err) {
              responseObj.status = constants.NotFound.status;
              responseObj.body.message = err;
              next(responseObj)
            });

        })
        .catch(function(err) {
          responseObj.status = constants.NotFound.status;
          responseObj.body.message = err;
          next(responseObj);
        });
    }
  });

  //OPTIONS for angular
  HITsIDRoute.options(function(req, res) {
    res.status(constants.OK.status);
    res.json({
      'message': constants.OK.message,
      'data': []
    });
  });

  return router;
}