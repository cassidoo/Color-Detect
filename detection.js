/**
 * @author Cassidy Williams
 */

/*
 *
 * This is for uploading files to the page, standard HTML5 jazz.
 *
 * */
function handleFileSelect(evt) {
	var files = evt.target.files;

	// Loop through the FileList and render image files as thumbnails
	for (var i = 0, f; f = files[i]; i++) {

		// Only process image files
		if (!f.type.match('image.*')) {
			continue;
		}

		var reader = new FileReader();

		// Capture the file info
		reader.onload = (function(theFile) {
			return function(e) {
				// Render thumbnail.
				var span = document.createElement('span');
				span.innerHTML = ['<img class="thumb" onclick="javascript:analyze(this);" src="', e.target.result, '" title="', escape(theFile.name), '"/>'].join('');
				document.getElementById('list').insertBefore(span, null);
			};
		})(f);

		// Read the image file as data URL
		reader.readAsDataURL(f);
	}
	var message = document.getElementById('message');
	message.innerHTML = 'Click any image to get theme colors!';
}

/*
 * This portion was created by referencing the article
 * "Using python and k-means to find the dominant colors in images"
 * By Charles Leifer
 * */

// You can see the Python version of this in Charles Leifer's article
function euclidean(point1, point2) {
	var s = 0;
	for (var i = 0, l = point1.length; i < l; i++)
	{
		s += Math.pow(point1[i] - point2[i], 2)
	}
	return Math.sqrt(s);
}

// There are various ways to convert rgb to hex, I found this on Stack Overflow.
function rgbToHex(rgb) {
        function toHex(c) {
          var hex = parseInt(c).toString(16);
          return hex.length == 1 ? '0' + hex : hex;
        }
        return '#' + toHex(rgb[0]) + toHex(rgb[1]) + toHex(rgb[2]);
}

function calculateCenter(points, n) {
	var values = []
	
	// Here we're populating the values array with 0s just so we know what size it should be (n)
	for (var i = 0; i < n; i++) {
		values.push(0);
	}
	
	var plength = 0;
	
	for (var i = 0, l = points.length; i < l; i++)
	{
		plength++;
		for (var j = 0; j < n; j++) {
			values[j] += points[i][j];
		}
	}
	
	// Using the average to get the centers
	for (var i = 0; i < n; i++) {
		values[i] = values[i] / plength;
	}
	
	return values;
}

// I basically just took this from Charles Leifer.
function k_mean(points, k, min_diff) {
	plength = points.length;
	colorGroup = [];
	seen = [];
	while (colorGroup.length < k) {
		idx = parseInt(Math.random() * plength);
		found = false;
		for (var i = 0; i < seen.length; i++) {
			if (idx === seen[i]) {
				found = true;
				break;
			}
		}
		if (!found) {
			seen.push(idx);
			colorGroup.push([points[idx], [points[idx]]]);
		}
	}

	while (true) {
		plists = [];
		for (var i = 0; i < k; i++) {
			plists.push([]);
		}

		for (var j = 0; j < plength; j++) {
			var p = points[j], smallest_distance = 10000000, idx = 0;
			for (var i = 0; i < k; i++) {
				var distance = euclidean(p, colorGroup[i][0]);
				if (distance < smallest_distance) {
					smallest_distance = distance;
					idx = i;
				}
			}
			plists[idx].push(p);
		}

		var diff = 0;
		for (var i = 0; i < k; i++) {
			var old = colorGroup[i], list = plists[i], center = calculateCenter(plists[i], 3), new_cluster = [center, (plists[i])], dist = euclidean(old[0], center);
			colorGroup[i] = new_cluster
			diff = diff > dist ? diff : dist;
		}
		if (diff < min_diff) {
			break;
		}
	}
	return colorGroup;
}


// Here's where we to actual interaction with the webpage
function processimg(img, canvaselement) {
	var points = [];
	
	// Drawing the given image onto a canvas 250x250 in size
	canvaselement.drawImage(img, 0, 0, 250, 250);
	
	// Getting data from said canvas.  This *DOES* get every pixel in the image.
	// Luckily, it's fast.
	dataCanvas = canvaselement.getImageData(0, 0, 250, 250).data;
	
	// Populating the points array with colors from the image
	for (var i = 0, l = dataCanvas.length; i < l; i += 4)
	{
		var r = dataCanvas[i], g = dataCanvas[i + 1], b = dataCanvas[i + 2];
		points.push([r, g, b]);
	}
	
	var totals = k_mean(points, 3, 1), hex = [];

	// If you try and convert the RGB to Hex directly here, it takes FOREVER, 
	// but if you have the helper method above, it works fast.  Strange.
	for (var i = 0; i < totals.length; i++) {
		hex.push(rgbToHex(totals[i][0]));
	}
	
	return hex;
}

// This is called when the user clicks an image.
function analyze(img_elem) {
	// This is getting the canvas from the page and the image in it 
	var canvaselement = document.getElementById('canvas').getContext('2d'), 
		img = new Image();
		
	// When the image
	img.onload = function() {
		var message = document.getElementById('message');
		//Hopefully we'll never see the "Loading..." message but it's here just in case
		message.innerHTML = 'Loading...';
		var colors = processimg(img, canvaselement); 
		
		// Showing the message of processing the image to the user
		message.innerHTML = 'Theme Colors: ';
		document.getElementById('color1').style.backgroundColor = colors[0]; 
		document.getElementById('color1').innerHTML = colors[0];
		document.getElementById('color2').style.backgroundColor = colors[1]; 
		document.getElementById('color2').innerHTML = colors[1];
		document.getElementById('color3').style.backgroundColor = colors[2]; 
		document.getElementById('color3').innerHTML = colors[2];	
	}
	img.src = img_elem.src;
}
