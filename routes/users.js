var express = require('express');
var router = express.Router();
var models  = require('../models');

router.get('/users', function(req, res, next) {
  models.User.findAll()
    .then(function(users) {
      res.json(users);
    });
});

module.exports = router;
