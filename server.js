var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
const scrapeSite = require('./src/scrapeSite');

// Require all models
var db = require('./models');

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger('dev'));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({
	extended: true
}));
// Use express.static to serve the public folder as a static directory
app.use(express.static('public'));

// Connect to the Mongo DB
MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/job_scraper_db";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);
// Routes

const rootLoad = async (req, res) => {
	// scrape updated listings
	await scrapeSite('https://news.ycombinator.com/jobs', res, 0)

	// GET route for root will scrape the most recent listings and then send the html
	await app.get('/', function (req, res) {
		res.sendFile('index.html')
	})

}

// scrape ycombinator and then send index.html
rootLoad();

// A GET route for scraping the echoJS website
app.get('/scrape', function (req, res) {
	// First, we grab the body of the html with request
	scrapeSite('https://news.ycombinator.com/jobs', res, 0)

});

// Route for getting all Jobs from the db
app.get('/Jobs', function (req, res) {
	// Grab every document in the Jobs collection
	db.Job.find({})
		.sort({date:'desc'})
		.populate('note')
		.then(function (dbJob) {
			// If we were able to successfully find Jobs, send them back to the client
			console.log(dbJob)
			res.json(dbJob);
		})
		.catch(function (err) {
			// If an error occurred, send it to the client
			res.json(err);
		});
});

// Route for grabbing a specific Job by id, populate it with it's note
app.get('/Jobs/:id', function (req, res) {
	// Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
	db.Job.findOne({
			_id: req.params.id
		})
		// ..and populate all of the notes associated with it
		.populate('note')
		.then(function (dbJob) {
			// If we were able to successfully find an Job with the given id, send it back to the client
			res.json(dbJob);
		})
		.catch(function (err) {
			// If an error occurred, send it to the client
			res.json(err);
		});
});

// Route for saving/updating an Job's associated Note
app.post('/Jobs/:id', function (req, res) {
	// Create a new note and pass the req.body to the entry
	db.Note.create(req.body)
		.then(function (dbNote) {
			// If a Note was created successfully, find one Job with an `_id` equal to `req.params.id`. Update the Job to be associated with the new Note
			// { new: true } tells the query that we want it to return the updated User -- it returns the original by default
			// Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
			return db.Job.findOneAndUpdate({
				_id: req.params.id
			}, {
				note: dbNote._id
			}, {
				new: true
			});
		})
		.then(function (dbJob) {
			// If we were able to successfully update an Job, send it back to the client
			res.json(dbJob);
		})
		.catch(function (err) {
			// If an error occurred, send it to the client
			res.json(err);
		});
});

// Start the server
app.listen(PORT, function () {
	console.log('App running on port ' + PORT + '!');
});