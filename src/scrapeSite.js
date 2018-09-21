var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var axios = require('axios');
var cheerio = require('cheerio');


// Require all models
var db = require('../models');

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

function scrapeSite(url, res) {
	axios.get(url).then(function (response) {
		// Then, we load that into cheerio and save it to $ for a shorthand selector
		var $ = cheerio.load(response.data);

		// grab every td and do the following:
		$('td').each((index, item) => {
			// Save an empty result object
			$item = $(item)
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
			if (result.title === 'More') {
				scrapeNext(result.link);
			};
		});

		// If we were able to successfully scrape and save an Job, send a message to the client
		res.send('Scrape Complete');
	});
}

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
};
function scrapeNext(url) {
  scrapeSite(`https://news.ycombinator.com/${url}`)
}
module.exports = scrapeSite;