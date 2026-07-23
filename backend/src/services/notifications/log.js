'use strict';

const Notification = require('../../models/Notification');

// Records a notification attempt. Must never throw — logging failures should
// not break the action that triggered the notification.
async function record(entry) {
  try {
    await Notification.create(entry);
  } catch (err) {
    console.error('[notif-log] failed to record notification:', err.message);
  }
}

module.exports = { record };
