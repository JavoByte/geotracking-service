/* eslint-disable import/prefer-default-export */
import bodyParser from 'body-parser';
import validate from 'validate.js';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Device from '../models/Device';
import config from '../../config';

const router = Router();

router.post('/', bodyParser.json(), (req, res) => {
  if (!req.body) res.sendStatus(400);
  else {
    const errors = validate(req.body, {
      device: {
        presence: true,
      },
    });
    if (errors) {
      res.status(422).json(errors);
    } else {
      const { device } = req.body;
      Device.findOne({
        identifier: device,
      }).select({
        _id: 0,
        identifier: 1,
      }).then((deviceObject) => {
        if (deviceObject) {
          const { key } = config;
          const token = jwt.sign({
            device,
          }, key);

          res.json({
            device: deviceObject,
            token,
          });
        } else {
          res.status(404).json({
            error: 'Device not found',
          });
        }
      }).catch((error) => {
        res.status(500).json({ error });
      });
    }
  }
});

export default router;
