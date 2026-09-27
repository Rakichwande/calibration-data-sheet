require('dotenv').config();
const express = require('express');
const cors = require('cors');

const sheetsRouter = require('./routes/sheets');
const instrumentsRouter = require('./routes/instruments');
const dueDatesRouter = require('./routes/dueDates');
const settingsRouter = require('./routes/settings');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/sheets', sheetsRouter);
app.use('/api/instruments', instrumentsRouter);
app.use('/api/due-dates', dueDatesRouter);
app.use('/api/settings', settingsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Calibration Data Sheet backend running on port ${PORT}`);
});
