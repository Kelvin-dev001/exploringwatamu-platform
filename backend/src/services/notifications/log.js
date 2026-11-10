'use strict';

const Notification = require('../../models/Notification');
const logger = require('../logger');

// Records a notification attempt. Must never throw — logging failures should
// not break the action that triggered the notification.
async function record(entry) {
  try {
    await Notification.create(entry);
  } catch (err) {
    logger.error('could not record a notification', { event: entry.event, channel: entry.channel, ...logger.errorFields(err) });
  }
}

module.exports = { record };
