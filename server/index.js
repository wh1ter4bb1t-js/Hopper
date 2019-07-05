const express = require('express');
const cors = require('cors');
const monk = require('monk');
const Filter = require('bad-words');
const rateLimit = require('express-rate-limit');

const app = express();

const db = monk(process.env.MONGO_URI || 'localhost/hopper');
const hops = db.get('hops');
const filter = new Filter();

app.enable('trust proxy');

app.use(cors());
app.use(express.json());

function isValidHop(hop) {
  return (
    hop.name &&
    hop.name.toString().trim() !== '' &&
    hop.content &&
    hop.content.toString().trim() !== ''
  );
}

app.get('/', (req, res) => {
  res.json({
    message: 'Hopper!'
  });
});

app.get('/hops', (req, res, next) => {
  let { skip, limit, sort = 'desc' } = req.query;
  skip = parseInt(skip) || 0;
  limit = parseInt(limit) || 10;

  skip = skip < 0 ? 0 : skip;
  Math.min(50, Math.max(1, limit));

  Promise.all([
    hops.count(),
    hops.find(
      {},
      {
        skip,
        limit,
        sort: {
          created: sort === 'desc' ? -1 : 1
        }
      }
    )
  ])
    .then(([total, hops]) => {
      res.json({
        hops,
        meta: {
          total,
          skip,
          limit,
          continued: total - (skip + limit) > 0
        }
      });
    })
    .catch(next);
});

app.use(
  rateLimit({
    windowMs: 30 * 1000,
    max: 1
  })
);

app.post('/hops', (req, res, next) => {
  if (isValidHop(req.body)) {
    const hop = {
      name: filter.clean(req.body.name.toString()),
      content: filter.clean(req.body.content.toString()),
      created: new Date()
    };

    hops
      .insert(hop)
      .then(createdHop => {
        res.json(createdHop);
      })
      .catch(next);
  } else {
    res.status(422);
    res.json({
      message: 'Name and Content is required'
    });
  }
});

app.use((error, req, res, next) => {
  res.status(500);
  res.json({
    message: error.message
  });
});

app.listen(5000, () => {
  console.log('Listening on https://localhost:5000');
});
