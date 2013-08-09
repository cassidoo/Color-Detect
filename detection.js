/**
 * @author Cassidy Williams
 */

/*
 *
 * This is for uploading files to the page, standard HTML5 jazz.
 *
 * */
function handleFileSelect(evt)
{
	var files = evt.target.files;

	// Loop through the FileList and render image files as thumbnails
	for (var i = 0, f; f = files[i]; i++)
	{

		// Only process image files
		if (!f.type.match('image.*'))
		{
			continue;
		}

		var reader = new FileReader();

		// Capture the file info
		reader.onload = (function(theFile)
		{
			return function(e)
			{
				// Render thumbnail.
				var span = document.createElement('span');
				span.innerHTML = ['<img class="thumb" onclick="javascript:analyze(this, event);" src="', e.target.result, '" title="', escape(theFile.name), '"/>'].join('');
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
function euclidean(point1, point2)
{
	var s = 0;
	for (var i = 0, l = point1.length; i < l; i++)
	{
		s += Math.pow(point1[i] - point2[i], 2)
	}
	return Math.sqrt(s);
}

// There are various ways to convert rgb to hex, I found this on Stack Overflow.
function rgbToHex(rgb)
{
	function toHex(c)
	{
		var hex = parseInt(c).toString(16);
		return hex.length == 1 ? '0' + hex : hex;
	}

	return '#' + toHex(rgb[0]) + toHex(rgb[1]) + toHex(rgb[2]);
}

function calculateCenter(points, n)
{
	var values = []

	// Here we're populating the values array with 0s just so we know what size it should be (n)
	for (var i = 0; i < n; i++)
	{
		values.push(0);
	}

	var plength = 0;

	for (var i = 0, l = points.length; i < l; i++)
	{
		plength++;
		for (var j = 0; j < n; j++)
		{
			values[j] += points[i][j];
		}
	}

	// Using the average to get the centers
	for (var i = 0; i < n; i++)
	{
		values[i] = values[i] / plength;
	}

	return values;
}

// I basically just took this from Charles Leifer.
function k_mean(points, k, min_diff)
{
	plength = points.length;
	colorGroup = [];
	seen = [];
	while (colorGroup.length < k)
	{
		idx = parseInt(Math.random() * plength);
		found = false;
		for (var i = 0; i < seen.length; i++)
		{
			if (idx === seen[i])
			{
				found = true;
				break;
			}
		}
		if (!found)
		{
			seen.push(idx);
			colorGroup.push([points[idx], [points[idx]]]);
		}
	}

	while (true)
	{
		plists = [];
		for (var i = 0; i < k; i++)
		{
			plists.push([]);
		}

		for (var j = 0; j < plength; j++)
		{
			var p = points[j], smallest_distance = 10000000, idx = 0;
			for (var i = 0; i < k; i++)
			{
				var distance = euclidean(p, colorGroup[i][0]);
				if (distance < smallest_distance)
				{
					smallest_distance = distance;
					idx = i;
				}
			}
			plists[idx].push(p);
		}

		var diff = 0;
		for (var i = 0; i < k; i++)
		{
			var old = colorGroup[i], list = plists[i], center = calculateCenter(plists[i], 3), new_cluster = [center, (plists[i])], dist = euclidean(old[0], center);
			colorGroup[i] = new_cluster
			diff = diff > dist ? diff : dist;
		}
		if (diff < min_diff)
		{
			break;
		}
	}
	return colorGroup;
}

// Here's where we to actual interaction with the webpage
function processimg(img, canvaselement)
{
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
	for (var i = 0; i < totals.length; i++)
	{
		hex.push(rgbToHex(totals[i][0]));
	}

	return hex;
}

function pick(img, canvaselement, x, y)
{
	var pickedColor = "hay";

	xx = x;
	yy = y;

	var imgData = canvaselement.getImageData(xx, yy, 1, 1).data;

	pickedColor = rgbToHex(imgData);

	return pickedColor;
}

// This is called when the user clicks an image.
function analyze(img_elem, event)
{
	// This is getting the canvas from the page and the image in it
	canvaselement = document.getElementById('canvas').getContext('2d'), img = new Image();
	//var coords = relMouseCoords(document.getElementById('canvas'), event);

	img.onload = function()
	{
		var message = document.getElementById('message');
		//Hopefully we'll never see the "Loading..." message but it's here just in case
		message.innerHTML = 'Loading...';
		var colors = processimg(img, canvaselement);

		// Showing the message of processing the image to the user
		message.innerHTML = 'Theme Colors';
		document.getElementById('color1').style.backgroundColor = colors[0];
		document.getElementById('color1').innerHTML = colors[0];
		document.getElementById('color2').style.backgroundColor = colors[1];
		document.getElementById('color2').innerHTML = colors[1];
		document.getElementById('color3').style.backgroundColor = colors[2];
		document.getElementById('color3').innerHTML = colors[2];

		var colorfun = pick(img, canvaselement, event.offsetX, event.offsetY);
		// pass in coordinates

		document.getElementById('pickedColor').style.backgroundColor = colorfun;
		document.getElementById('pickedColor').innerHTML = colorfun;
		
		document.getElementById('scheme').style.display="block";
		
		createSwatches(colorfun);

	}

	img.src = img_elem.src;
}

// This is for the swatches that are generated from the picked color.
function createSwatches(hex)
{
	nHex = hex;

	// The light and dark values could potentially be changed so colors are changed based on these hues.  
	// It's this way just in case we expand it to include such functionality.
	var lightRGB = new Array(255, 255, 255);
	var darkRGB = new Array(0, 0, 0);
	var colorValues = new Array();
	var swatch = new Array();

	baseColor = hexToRGB(nHex);
	opArray = new Array(1.0, .75, .50, .25, .10, .85, .75, .50, .25, .10);
	for ( i = 0; i < 10; i++)
	{
		nMask = i < 5 ? lightRGB : darkRGB;

		nColor = setColorHue(baseColor, opArray[i], nMask);

		nHex = toHex(nColor[0]) + toHex(nColor[1]) + toHex(nColor[2]);

		colorValues[i] = new Array();
		colorValues[i][0] = nHex;
		colorValues[i][1] = nColor;
		
		// Actually putting the swatches on the page
		document.getElementById("s"+i).style.backgroundColor = "#" + nHex;
	}
}

// Actually crating the hues with different lightness
function setColorHue(originColor, opacityPercent, maskRGB)
{
	returnColor = new Array();
	for ( w = 0; w < originColor.length; w++)
		returnColor[w] = Math.round(originColor[w] * opacityPercent) + Math.round(maskRGB[w] * (1.0 - opacityPercent));
	return returnColor;
}

// Helper method for sonverting to HEX
function toHex(dec) {
	hex=dec.toString(16);
	if(hex.length==1)hex="0"+hex;
	if(hex==100)hex="FF";
	return hex.toUpperCase();
}

//Converting HEX to RGB
function hexToRGB(hex)
{
	var r = hexToR(hex);
	var g = hexToG(hex);
	var b = hexToB(hex);

	function hexToR(h)
	{
		return parseInt((cutHex(h)).substring(0, 2), 16)
	}

	function hexToG(h)
	{
		return parseInt((cutHex(h)).substring(2, 4), 16)
	}

	function hexToB(h)
	{
		return parseInt((cutHex(h)).substring(4, 6), 16)
	}

	function cutHex(h)
	{
		return (h.charAt(0) == "#") ? h.substring(1, 7) : h
	}

	return new Array(r, g, b);
}


// This is currently not used.  Maybe if we start playing with hues and everything, it'll be useful!
/*
 function HueShift(h,s) {
 h+=s;
 while (h>=360.0) h-=360.0;
 while (h<0.0) h+=360.0;
 return h;
 }

 function convertToHSV(hex)
 {
 var r = hexToR(hex);
 var g = hexToG(hex);
 var b = hexToB(hex);

 function hexToR(h)
 {
 return parseInt((cutHex(h)).substring(0, 2), 16)
 }

 function hexToG(h)
 {
 return parseInt((cutHex(h)).substring(2, 4), 16)
 }

 function hexToB(h)
 {
 return parseInt((cutHex(h)).substring(4, 6), 16)
 }

 function cutHex(h)
 {
 return (h.charAt(0) == "#") ? h.substring(1, 7) : h
 }

 var computedH = 0;
 var computedS = 0;
 var computedV = 0;

 r = r / 255;
 g = g / 255;
 b = b / 255;
 var minRGB = Math.min(r, Math.min(g, b));
 var maxRGB = Math.max(r, Math.max(g, b));

 // Black-gray-white
 if (minRGB == maxRGB)
 {
 computedV = minRGB;
 return [0, 0, computedV];
 }

 // Colors other than black-gray-white:
 var d = (r == minRGB) ? g - b : ((b == minRGB) ? r - g : b - r);
 var h = (r == minRGB) ? 3 : ((b == minRGB) ? 1 : 5);
 computedH = 60 * (h - d / (maxRGB - minRGB));
 computedS = (maxRGB - minRGB) / maxRGB;
 computedV = maxRGB;
 return [computedH, computedS, computedV];

 }
 */