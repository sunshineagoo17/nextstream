const express = require('express');
const { createEvent } = require('ics');
const router = express.Router();

// Route to create ICS
router.post('/create-ics', (req, res) => {
  const { title, start, end, description, location } = req.body;

  if (!title || !start || !end || !location) {
    return res.status(400).send('Missing required event fields');
  }

  const event = {
    start: [
      parseInt(start.slice(0, 4)),
      parseInt(start.slice(5, 7)),
      parseInt(start.slice(8, 10)),
      parseInt(start.slice(11, 13)),
      parseInt(start.slice(14, 16))
    ],
    end: [
      parseInt(end.slice(0, 4)),
      parseInt(end.slice(5, 7)),
      parseInt(end.slice(8, 10)),
      parseInt(end.slice(11, 13)),
      parseInt(end.slice(14, 16))
    ],
    title,
    description,
    location,
  };

  createEvent(event, (error, value) => {
    if (error) {
      console.error('Error generating ICS event:', error);
      return res.status(500).send('Error generating calendar file.');
    }

    // Sends the ICS file directly in the response
    res.setHeader('Content-Disposition', 'attachment; filename=event.ics');
    res.setHeader('Content-Type', 'text/calendar');
    res.send(value); 
  });
});

module.exports = router;