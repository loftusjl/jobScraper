var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require('axios');
var cheerio = require('cheerio');

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
mongoose.connect('mongodb://localhost/job_scraper_db');

// Routes

// A GET route for scraping the echoJS website
app.get('/scrape', function (req, res) {
	// First, we grab the body of the html with request
	axios.get('https://news.ycombinator.com/jobs').then(function (response) {
		// Then, we load that into cheerio and save it to $ for a shorthand selector
		var $ = cheerio.load(response.data);

		// grab every td and do the following:
		$('td').each((index, item) => {
			// console.log('#####', $(this))
			// Save an empty result object
			$item = $(item)
			console.log('item  ',item)
			console.log('this  ',$(this))
			var result = {};
			result.link = $item
				.children('a')
				.attr('href')
			// Add the text and href of every link, and save them as properties of the result object
			result.title = $item
				.children('a')
				.text();

			// Create a new Job using the `result` object built from scraping
			if (result.title && result.link && result.link.includes('http')) {
				createJob(result)
			}
		});

		// If we were able to successfully scrape and save an Job, send a message to the client
		res.send('Scrape Complete');
	});
});

// Route for getting all Jobs from the db
app.get('/Jobs', function (req, res) {
	// Grab every document in the Jobs collection
	db.Job.find({})
		.then(function (dbJob) {
			// If we were able to successfully find Jobs, send them back to the client
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


function createJob(result) {

	db.Job.create(result)

		.then(function (dbJob) {

			// View the added result in the console
			console.log('dbjob',dbJob);
			return dbJob;
		})
		.catch(function (err) {
			// If an error occurred, send it to the client
			console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',err);
			throw new Error(err);
		})
}