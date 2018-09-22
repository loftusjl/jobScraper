// Grab the Jobs as a json
$.getJSON("/Jobs", function(data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    // $("#Jobs").append("<p data-id='" + data[i]._id + "'>" + data[i].title + "<br />" + data[i].link + "</p>");
    $('#Jobs').append(
      `<div class="col s12 m5 l4">
      <div class="card medium">
        <div class="card-image waves-effect waves-block waves-light">
          <img class="responsive-img activator" src="./img/pexels-photo-684385.jpeg">
        </div>
          <div class="card-content">
            <p class="" data-id="${data[i]._id}">${(data[i].title).substring(0,25)}...<i class="material-icons right">more_vert</i></p>
          </div>
          <div class="card-action">
            <a href="${data[i].link}">See the posting</a>
          </div>
          <div class="card-reveal">
          <span class="card-title grey-text text-darken-4">Job Listing<i class="material-icons right">close</i></span>
          <p>${data[i].title}</p>
          <input id='titleinput' name='title' >
          <textarea id='bodyinput' name='body'></textarea>
          <a class="btn waves-effect waves-light" data-id=${data._id} id='savenote'>Save Note</a>
          <div class="card-action">
            <a class="btn waves-effect waves-light" href="${data[i].link}">See the posting</a>
          </div>
        </div>
      </div>
    </div>`
    )
  }
});


// Whenever someone clicks a p tag
$(document).on("click", "p", function() {
  // Empty the notes from the note section
  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Job
  $.ajax({
    method: "GET",
    url: "/Jobs/" + thisId
  })
    // With that done, add the note information to the page
    .then(function(data) {
      console.log(data);
      // The title of the Job
      $("#notes").append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $("#notes").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the Job saved to it
      $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

      // If there's a note in the Job
      if (data.note) {
        // Place the title of the note in the title input
        $("#titleinput").val(data.note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(data.note.body);
      }
    });
});

// When you click the savenote button
$(document).on("click", "#savenote", function() {
  // Grab the id associated with the Job from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/Jobs/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .then(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});
