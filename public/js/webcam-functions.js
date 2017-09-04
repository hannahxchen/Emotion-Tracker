function preview_snapshot() {
	// freeze camera so user can preview pic
	Webcam.freeze();

	// swap button sets
	document.getElementById('pre_take_buttons').style.display = 'none';
	document.getElementById('post_take_buttons').style.display = '';
}

function cancel_preview() {
	// cancel preview freeze and return to live camera feed
	Webcam.unfreeze();

	// swap buttons back
	document.getElementById('pre_take_buttons').style.display = '';
	document.getElementById('post_take_buttons').style.display = 'none';
}

function save_photo() {
	// actually snap photo (from preview freeze) and display it
	Webcam.snap( function(data_uri) {
		// display results in page
		document.getElementById('results').innerHTML =
			'<h2>Here is your image:</h2>' +
			'<img src="'+data_uri+'"/>';

		// swap buttons back
		document.getElementById('pre_take_buttons').style.display = '';
		document.getElementById('post_take_buttons').style.display = 'none';
} );
}
