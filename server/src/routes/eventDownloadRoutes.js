const express = require('express');
const { writeFileSync } = require('fs');
const { createEvent } = require('ics');
const path = require('path');

const router = express.Router();

router.get('/ics', (req, res) => {
  const { title, start, end, description, location } = req.query;

  const event = {
    start: [parseInt(start.slice(0, 4)), parseInt(start.slice(5, 7)), parseInt(start.slice(8, 10)), parseInt(start.slice(11, 13)), parseInt(start.slice(14, 16))],
    end: [parseInt(end.slice(0, 4)), parseInt(end.slice(5, 7)), parseInt(end.slice(8, 10)), parseInt(end.slice(11, 13)), parseInt(end.slice(14, 16))],
    title,
    description,
    location,
  };

  createEvent(event, (error, value) => {
    if (error) {
      console.log(error);
      return res.status(500).send('Error generating calendar file.');
    }

    const filePath = path.join(__dirname, 'calendar-event.ics');
    writeFileSync(filePath, value);

    res.download(filePath, 'event.ics');
  });
});

module.exports = router;