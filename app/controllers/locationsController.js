/* eslint-disable import/prefer-default-export */
import validate from 'validate.js';
import { Router } from 'express';
import Location from '../models/Location';

const router = Router();

router.get('/', (req, res) => {
  const constraints = {
    since: (value, attributes) => {
      const until = parseInt(attributes.until, 10);
      const untilValid = !isNaN(until) && until >= 1483228800;
      return {
        presence: true,
        numericality: untilValid ? {
          greaterThanOrEqualTo: 1483228800,
          lessThanOrEqualTo: until,
        } : false,
      };
    },
    until: {
      presence: true,
      numericality: {
        lessThanOrEqualTo: Math.floor(+new Date() / 1000),
        greaterThanOrEqualTo: 1483228800,
      },
    },
    device: {
      presence: true,
    },
  };

  const errors = validate(req.query, constraints);
  if (errors) {
    res.status(422).json(errors);
  } else {
    const { device, until, since } = req.query;
    Location
      .find({
        device,
        timestamp: {
          $gte: since,
          $lte: until,
        },
      })
      .select({
        _id: 0,
        device: 1,
        timestamp: 1,
        latitude: 1,
        longitude: 1,
      })
      .sort({ timestamp: 1 })
      .exec((error, locations) => {
        if (error) {
          res.status(500).json({
            error,
          });
        } else {
          res.status(200).json({
            locations,
          });
        }
      });
  }
});

export default router;
