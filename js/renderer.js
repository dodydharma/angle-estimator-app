// const information = document.getElementById('info')
// information.innerText = `This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`

// const func = async () => {
// 	const response = await window.versions.ping()
// 	console.log(response) // prints out 'pong'
// }
// func()



/**  https://github.com/dodydharma */

// User Interface  variable
var window = globalThis;
var width = window.innerWidth;
var height = window.innerHeight;

let stage;
let imageLayer ;

let lineGroup;
let dashedLineGroup;
let pointGroup;
let centerGroup;
let labelGroup;
let boundingBoxGroup;
let intersectionGroup;
let intersectionLabelGroup;

// memory for current drawing operation
let line;
let circle;

let cursor;
let originClickPosition;
let currentShapeName;
let currentShapeCenter;
let currentLabel;
let mouseCurrentPosition


$('#reset').click(function() {
	location.reload();
});

// Help Protocol information Dialog
$( "#protocolA" ).dialog({width : 650});
$( "#protocolA" ).dialog({position: { my: "right bottom", at: "right bottom", of: window }});
$( "#protocolA" ).dialog( "close" );
$( "#showProtocolA" ).on( "click", function(event) {
	showProtocolUI("A");
	event.preventDefault();
});

$( "#protocolB" ).dialog({width : 650});
$( "#protocolB" ).dialog({position: { my: "right bottom", at: "right bottom", of: window }});
$( "#protocolB" ).dialog( "close" );
$( "#showProtocolB" ).on( "click", function(event) {
	showProtocolUI("B");
	event.preventDefault();
});

$( "#SavingWindow" ).dialog({width : 300});
$( "#SavingWindow" ).dialog( "close" );

$( "#freeDraw" ).on( "click", function(event) {
	showProtocolUI("G");
	event.preventDefault();
})



// Check the draw mode line,circle, or point
function getDrawMode() {
	return $('input[name=drawmode]:checked', '#drawmode').val();
}
let drawmode = getDrawMode()

$('#drawmode input').on('change', function() {
	drawmode = getDrawMode()
	isShowBoundingBox(drawmode == 'delete');
});

let shapeColor;
$("#picker").colorPick({
	'initialColor' : '#c0392b',
	'palette': ["#f1c40f", "#f39c12", "#e67e22", "#d35400", "#e74c3c", "#c0392b", "#ecf0f1","#1abc9c", "#16a085", "#2ecc71", "#27ae60", "#3498db", "#2980b9", "#9b59b6", "#8e44ad", "#34495e", "#2c3e50"],
	'onColorSelected': function() {
		shapeColor = this.color
		this.element.css({'backgroundColor': this.color, 'color': this.color});
	}
});

// Undo functionality
let lastShape;
let lastLabel;
$("#undo").button();
$("#undo" ).button( "option", "disabled", true );

$("#undo" ).on( "click", function( event ) {
	if(lastLabel){
		lastLabel.destroy()
		lastLabel = null
	}

	if(lastShape){
		lastShape.destroy()
		lastShape = null
	}

	$( "#undo" ).button( "option", "disabled", true );
	event.preventDefault();
} );

function activateUndo(){
	circle? lastShape = circle: lastShape = line
	lastLabel = currentLabel
	$( "#undo" ).button( "option", "disabled", false );
}

// listen for the file input change event and load the image.
let URL = window.webkitURL || window.URL;
//let url = 'images/plain.jpg';
let url = 'images/NO08F52A.JPG';
$("#file_input").change(function(e){
	url = URL.createObjectURL(e.target.files[0]);
	initialize();
});


// adjust  image view resolution
let imageViewResolution = 1000
let isWaitingInitializing = 0;
var handle = $( "#custom-handle" );
$( "#slider" ).slider({
	create: function() {
		handle.text( 'view max '+imageViewResolution+' px' );
	},
	slide: function( event, ui ) {
		imageViewResolution = ui.value
		handle.text( 'view max '+imageViewResolution+' px' );
		if (url){
			isWaitingInitializing += 1;
			setTimeout(function() {
				console.log(isWaitingInitializing)
				isWaitingInitializing-=1;
				if(isWaitingInitializing <=0){
					initialize()
				}
			}, 100);

		}
	},
	min: 500,
	value:imageViewResolution,
	max: 5000,
});

let showFullImageResolution = false
$('#checkboxWrapperisFullSize :checkbox').change(function() {
	showFullImageResolution = this.checked
	if(showFullImageResolution)
		$( "#slider" ).hide()
	else
		$( "#slider" ).show()
	initialize()
});

function downloadURI(uri, name) {
	var link = document.createElement('a');
	link.download = name;
	link.href = uri;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	delete link;

	$( "#SavingWindow" ).dialog( "close" );

}

var isWaitingSave = 0
$( "#save" ).on( "click", function(event) {
	$( "#SavingWindow" ).dialog( "open" );

	isWaitingSave+= 1;
	setTimeout(function() {
		isWaitingSave -= 1
		if (isWaitingSave <= 0){
			var dataURL = stage.toDataURL({ pixelRatio: 3 });
			downloadURI(dataURL, 'angle-calculation.png');
		}
	}, 100);


	event.preventDefault();
});



// Primitive Function for drawing
function startDrawLine(xF,yF, xT,yT, color, customLabel='', dashed=false){
	currentShapeName =  'line-' + (lineGroup.getChildren().length+1)
	if(customLabel != '')
		currentShapeName= 'line-'+customLabel;
	let lineColor = 'rgb(255,'+Math.floor(Math.random() *100)+55+','+Math.floor(Math.random() * 255)+')'

	if(dashed) currentShapeName = ''
	dashProp = dashed? [7, 3]: null;

	line = new Konva.Line({
		stroke: color?color:lineColor,
		// remove line from hit graph, so we can check intersections
		listening: false,
		points: [xF, yF, xT, yT],
		name: currentShapeName,
		id: 'line-' + (lineGroup.children.length+1),
		dash: dashProp,
	});

	currentShapeCenter = new Konva.Circle({
		x: xF,
		y: yF,
		radius: 1,
		stroke: 'black',
		fill: 'black',
		name: 'center-'+currentShapeName,
		id:'center-'+currentShapeName,
		listening: false
	});
	centerGroup.add(currentShapeCenter);

	currentLabel = new Konva.Text({
		x: xF+ (xT-xF)/2,
		y: yF+ (yT-yF)/2,
		text: currentShapeName,
		fontSize: 13,
		fontFamily: 'Calibri',
		fill: color?color:lineColor,
		align: 'left',
		id:'label-line-'+(lineGroup.children.length+1)
	});
	currentLabel.offsetX(currentLabel.width() / 2);
	currentLabel.x(currentLabel.x()+ currentLabel.width())
	labelGroup.add(currentLabel)

	if(dashed)
		dashedLineGroup.add(line)
	else lineGroup.add(line);

	activateUndo();

	return [line, currentShapeCenter, currentLabel];
}

// Primitive Function
function createCircle(x,y,r, color='red', customLabel=''){
	// convert Point Index to alphabet character, 1, 2,3 to  point A, point B, point C
	var pointIndex =pointGroup.getChildren().length+1
	var pointIndexInAlphacharacter = (pointIndex + 9).toString(36).toUpperCase();
	currentShapeName= 'point-'+pointIndexInAlphacharacter;
	if(customLabel != '')
		currentShapeName= 'point-'+customLabel;

	circle = new Konva.Circle({
		x: x,
		y: y,
		radius: 3,
		stroke: color,
		name: currentShapeName,
		id:currentShapeName,
	});
	pointGroup.add(circle);

	currentShapeCenter = new Konva.Circle({
		x: x,
		y: y,
		radius: 1,
		stroke: 'black',
		fill: 'black',
		name: 'center-'+currentShapeName,
		id:'center-'+currentShapeName,
		listening: false
	});
	centerGroup.add(currentShapeCenter);


	currentLabel = new Konva.Text({
		x: x,
		y: y,
		text: currentShapeName,
		fontSize: 13,
		fontFamily: 'Calibri',
		fill: color,
		align: 'center',
		id:'label-'+currentShapeName
	});
	// currentLabel.offsetX(currentLabel.width() / 2);
	currentLabel.x(x - currentLabel.width()/2)
	currentLabel.y(y + currentLabel.height()*2)
	labelGroup.add(currentLabel)

	circle.on('mousedown', (e) => {
		if(drawmode == 'line')
		{
			// get circle's center coordinate relative to the Image
			const pos = e.target.getAbsolutePosition(stage)
			originClickPosition = pos;
			startDrawLine(pos.x, pos.y, pos.x, pos.y,shapeColor);

		}else if(drawmode == 'delete'){
			e.target.destroy()
			labelGroup.getChildren().forEach(deleteTargetLabel);
			function deleteTargetLabel(label, index, array){
				if(label.text() == e.target.name())
					label.destroy();
			}
		}

		activateUndo();

	});

	return [circle, currentShapeCenter, currentLabel];
}

function initialize(){
	if(stage)
		stage.remove();

	stage = new Konva.Stage({
		container: 'container',
		width: width,
		height: height,
	});

	imageLayer = new Konva.Layer();
	stage.add(imageLayer);

	// Main Image loading
	var img = new Image();
	img.src = url;

	img.onload = function() {
		var img_width = img.width;
		var img_height = img.height;
		// calculate dimensions to get max  pixel
		var max = imageViewResolution;
		var ratio = (img_width > img_height ? (img_width / max) : (img_height / max))
		// max = (img_width > img_height) ? max : (img_width > window.innerWidth) ? window.innerWidth : max
		var ratio = img_width/max

		if(showFullImageResolution)
			ratio = 1

		// now load the main working image into Konva
		var workingImage = new Konva.Image({
			image: img,
			x: 0,
			y: 0,
			width: img_width / ratio,
			height: img_height / ratio,
			draggable: false,
			rotation: 0
		});

		stage.height(img_height / ratio);
		imageLayer.add(workingImage);

		dashedLineGroup			  = new Konva.Group();    imageLayer.add(dashedLineGroup)
		lineGroup                 = new Konva.Group();    imageLayer.add(lineGroup)
		pointGroup                = new Konva.Group();    imageLayer.add(pointGroup)
		centerGroup               = new Konva.Group();    imageLayer.add(centerGroup)
		labelGroup                = new Konva.Group();    imageLayer.add(labelGroup)
		intersectionGroup         = new Konva.Group();    imageLayer.add(intersectionGroup)
		intersectionLabelGroup    = new Konva.Group();    imageLayer.add(intersectionLabelGroup)


		Konva.Image.fromURL('images/target-cursor.png',
			function (img ) {
				img.listening( false)
				cursor = img
				imageLayer.add(cursor );
			});

		imageLayer.draw();

		// create smaller preview stage
		var zoomScale = 5
		maxZoomWidth = 400
		var previewWidth =  math.min(window.innerWidth / 3, maxZoomWidth)
		var previewHeight = math.min(window.innerHeight / 3, maxZoomWidth)
		const previewStage = new Konva.Stage({
			container: 'preview',
			width: previewWidth,
			height: previewHeight,
			scaleX: zoomScale,
			scaleY: zoomScale,
		});

		// clone original imageLayer, and disable all events on it
		// we will use "let" here, because we can redefine imageLayer later
		let previewLayer = imageLayer.clone({ listening: false });
		previewStage.add(previewLayer);

		function updatePreview() {
			// remove all layer
			previewLayer.destroy();
			// generate new one
			previewLayer = imageLayer.clone({ listening: false });
			previewStage.add(previewLayer);
		}

		function updateCursor() {
			if(stage){
				mouseCurrentPosition = stage.getPointerPosition()
			}

			if(mouseCurrentPosition && cursor){
				cursor.x(mouseCurrentPosition.x - cursor.width()/2)
				cursor.y(mouseCurrentPosition.y - cursor.height()/2)
			}
		}

		// Handle Zoom Window Positioning
		$( function() {
			// Enable Dragging
			$( "#preview" ).draggable();
			// Enable following  mouse vertical position
			$( "#preview" ).css({left: window.innerWidth-(previewWidth+3)})

			var timeout;
			var isWaitingResizing = 0
			$( "#container").mousemove(function(event) {

				// Automove zoom preview

				// if (timeout !== undefined) {window.clearTimeout(timeout);}
				// timeout = window.setTimeout(function () {
				//   $("#preview").animate({
				//     "top" : event.pageY <= previewHeight? 100:
				//       event.pageY > height - previewHeight/2?event.pageY-previewHeight:
				//         event.pageY-previewHeight
				//   })}, 100);

			});

			$(window).resize(function()
			{
				isWaitingResizing+= 1;
				setTimeout(function() {
					isWaitingResizing -= 1;

					if(isWaitingResizing <= 0){
						if($( "#preview" ).position().left > window.innerWidth-(previewWidth +3))
							$( "#preview" ).css({left: window.innerWidth-(previewWidth +3)})

						if($('#protocolA').dialog('isOpen')){
							$( "#protocolA" ).dialog({position: { my: "right bottom", at: "right bottom", of: window }});
							$( '#protocolA').parent().css({position:"fixed"});
						}
						if($('#protocolB').dialog('isOpen')){
							$( "#protocolB" ).dialog({position: { my: "right bottom", at: "right bottom", of: window }});
							$( '#protocolB').parent().css({position:"fixed"});
						}
					}


				}, 100);
			});

		});

		imageLayer.on('mousemove', function (e) {
			updateCursor()
			previewStage.x(-mouseCurrentPosition.x*zoomScale + previewWidth/2);
			previewStage.y(-mouseCurrentPosition.y*zoomScale + previewHeight/2);

		});


		//  Main Drawing Event
		workingImage.on('mousedown', (e) => {
			// const leftClick = (e.evt.button === 0)
			// const rightClick= (e.evt.button === 2)
			updateCursor()
			originClickPosition = mouseCurrentPosition;

			var currentAction = runProtocol()
			console.log("current action ", currentAction)

			if(currentAction == null) // Free Draw
			{
				console.log("Free Draw", drawmode)

				if(drawmode == 'circle')
				{
					createCircle(mouseCurrentPosition.x, mouseCurrentPosition.y, 0, shapeColor);
				}

				if(drawmode == 'point')
				{
					createCircle(mouseCurrentPosition.x, mouseCurrentPosition.y, 3, shapeColor);
				}

				if(drawmode == 'line')
				{
					startDrawLine(mouseCurrentPosition.x, mouseCurrentPosition.y, mouseCurrentPosition.x, mouseCurrentPosition.y, shapeColor);
				}
			}
			else if(currentAction == {}) // end of a protocol
			{
				console.log("End of protocol")

			}else{
				console.log("Execute Protocol of step ", stateProcedure.currentSteps , currentAction)
				drawmode = currentAction.action
				if(drawmode == 'circle')
				{
					createCircle(mouseCurrentPosition.x, mouseCurrentPosition.y, 0, shapeColor, currentAction.label);
				}

				if(drawmode == 'point')
				{
					createCircle(mouseCurrentPosition.x, mouseCurrentPosition.y, 3, shapeColor, currentAction.label);
				}

				if(drawmode == 'line')
				{
					startDrawLine(mouseCurrentPosition.x, mouseCurrentPosition.y, mouseCurrentPosition.x, mouseCurrentPosition.y, shapeColor, currentAction.label);
				}
			}



		});


		stage.on('mousemove', (e) => {
			// if nothing to render, just update the zoom preview
			if (!line && !circle) {
				updatePreview();
				return;
			}

			// if draw point only, no need to update on mouse move
			if(drawmode == 'point')
			{
				updatePreview();
				return;
			}

			updateCursor();

			const mouseDisplacementMagnitude = math.distance([originClickPosition.x, originClickPosition.y], [mouseCurrentPosition.x,mouseCurrentPosition.y])
			const centerX =  originClickPosition.x + ( mouseCurrentPosition.x - originClickPosition.x)/2
			const centerY =  originClickPosition.y + ( mouseCurrentPosition.y - originClickPosition.y)/2
			const lineLabelX =  originClickPosition.x + ( mouseCurrentPosition.x - originClickPosition.x)*2/3
			const lineLabelY =  originClickPosition.y + ( mouseCurrentPosition.y - originClickPosition.y)*2/3

			// Update line rendering
			if(drawmode == 'line'){
				const points = line.points().slice();
				points[2] = mouseCurrentPosition.x;points[3] = mouseCurrentPosition.y;
				line.points(points);
				currentLabel.x(lineLabelX + currentLabel.width())
				currentLabel.y(lineLabelY + currentLabel.height()/4)
				currentLabel.text( line.name()+' | '+ mouseDisplacementMagnitude.toFixed(2))

				currentShapeCenter.x(centerX)
				currentShapeCenter.y(centerY)
			}

			// Update circle rendering
			if(drawmode == 'circle'){
				circle.radius(mouseDisplacementMagnitude);
				circle.x(mouseCurrentPosition.x)
				circle.y(mouseCurrentPosition.y);
				currentShapeCenter.x(mouseCurrentPosition.x)
				currentShapeCenter.y(mouseCurrentPosition.y)
				currentLabel.x(currentShapeCenter.x() + currentLabel.width()/2)
				currentLabel.y(currentShapeCenter.y() + currentLabel.height()/4)

			}

			imageLayer.batchDraw();
			updatePreview();

		});

		stage.on('mouseup', (e) => {
			if(validateShape() == true)
				UpdateProtocol()

			activateUndo()
			imageLayer.draw();

			// clear memory
			line = null;
			circle = null;
			currentLabel = null;
			currentShapeName = null;
		});

		function validateShape(){
			console.log("validate ", drawmode)
			if(drawmode == 'line'){
				ln = line.points()
				if(math.distance([ln[0], ln[1]], [ln[2],ln[3]]) <= 0){
					cancelDraw()
					return false;
				}

			}

			return true;
		}

		function cancelDraw() {
			console.log('cancel draw')
			if (line ){line.destroy(); currentShapeCenter.destroy(), currentLabel.destroy()}
			if  (circle) circle.destroy();
		}
	}
}

function isShowBoundingBox(show=false){
	console.log('isShowBoundingBox', show)

	if(!imageLayer)
		return;

	if(show){
		boundingBoxGroup  = new Konva.Group();
		imageLayer.add(boundingBoxGroup)

		var points = pointGroup.getChildren()
		var lines = lineGroup.getChildren()

		function showBoundingbox(shape){
			var boundingBox = shape.getClientRect({ relativeTo: boundingBox });
			var box = new Konva.Rect({
				x: boundingBox.x,
				y: boundingBox.y,
				width: boundingBox.width,
				height: boundingBox.height,
				stroke: 'red',
				strokeWidth: 1,
				name: shape.name()
			});

			boundingBoxGroup.add(box);

			box.on('mousedown', (e) => {
				if(drawmode == 'delete'){
					var shapeName = e.target.name()

					foundShape = stage.find('#'+shapeName)[0];
					if(foundShape)foundShape.destroy();

					foundLabel = stage.find('#label-'+shapeName)[0];
					if(foundLabel)foundLabel.destroy();

					foundCenter = stage.find('#center-'+shapeName)[0];
					if(foundCenter)foundCenter.destroy();

					intersectionGroup.getChildren().forEach(intersection =>{
						if(intersection.id().includes(shapeName))
							console.log(intersection.id(), shapeName,intersection.id().includes(shapeName))
						intersection.destroy()
					})

					intersectionLabelGroup.getChildren().forEach(intersectionLabel =>{
						if(intersectionLabel.id().includes(shapeName))
							intersectionLabel.destroy()
					})

					e.target.destroy()
				}

			});
		}

		points.forEach(point => {
			showBoundingbox(point)
		})

		lines.forEach(line => {
			showBoundingbox(line)
		})
	}else{
		if(boundingBoxGroup){
			boundingBoxGroup.remove()
		}

	}

}

// returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
function isIntersects(a,b,c,d,p,q,r,s) {
	var det, gamma, lambda;
	det = (c - a) * (s - q) - (r - p) * (d - b);
	if (det === 0) {
		return false;
	} else {
		lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
		gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
		return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
	}
};

function findLineIntersections(){
	var lines = lineGroup.getChildren();
	lines.forEach(checkEveryLine);
	function checkEveryLine(currentLine, currentLineIndex, otherLines) {
		otherLines.forEach(checkIntersection);
		function checkIntersection(otherLine, otherLineIndex, array) {
			// don't compare to self and only compare once
			if(currentLineIndex >  otherLineIndex){
				findTwoLinesIntersection(currentLine,otherLine)
			}
		}
	}
}

function findTwoLinesIntersection(currentLine,otherLine, inCludeOutSideLineRange = false, label= ''){
	var xy1 = currentLine.points();
	var xy2 = otherLine.points();
	var isIntersX = isIntersects(xy1[0], xy1[1], xy1[2], xy1[3], xy2[0], xy2[1], xy2[2], xy2[3])

	if(isIntersX){
		// check existing intersection rendering
		var itxID = currentLine.id()+'-'+otherLine.id()
		found = stage.find('#'+itxID)[0];
		if(!found){
			generateIntersectionData(currentLine, otherLine)
		}
	}else if(inCludeOutSideLineRange){
		var pointOfIntersection = math.intersect([xy1[0], xy1[1]], [xy1[2], xy1[3]], [xy2[0], xy2[1]], [xy2[2], xy2[3]])
		console.log("pointOfIntersection outside line",pointOfIntersection, label)
		// createCircle(pointOfIntersection[0],pointOfIntersection[1],5,'red')
		generateIntersectionData(currentLine, otherLine, inCludeOutSideLineRange, label)
	}

}


function generateIntersectionData(firstLine, secondLine, inCludeOutSideLineRange= false, label=''){
	var xy1 = firstLine.points();
	var xy2 = secondLine.points();

	var pointOfIntersection = math.intersect([xy1[0], xy1[1]], [xy1[2], xy1[3]], [xy2[0], xy2[1]], [xy2[2], xy2[3]])

	var intersectionAngle = getIntersectionAngle(xy1, pointOfIntersection, xy2)
	var intersectionResultant = getIntersectionResultant(xy1, pointOfIntersection, xy2)
	//var horizonAngle = getHorizonAngle(xy1, pointOfIntersection, xy2)
	var horizontalvector = getHorizonVector(xy1, pointOfIntersection, xy2)

	console.log('intersaection custon label', label)
	createIntersectionPoint(pointOfIntersection[0],pointOfIntersection[1],2, firstLine.id(), secondLine.id(),
		intersectionAngle, intersectionResultant, horizontalvector, shapeColor, label)

	if(inCludeOutSideLineRange){
		fp1 = getFurthestPointFrom(xy1, pointOfIntersection)
		startDrawLine(fp1[0], fp1[1], pointOfIntersection[0], pointOfIntersection[1],shapeColor,'',true)
		fp2 =getFurthestPointFrom(xy2, pointOfIntersection)
		startDrawLine(fp2[0], fp2[1], pointOfIntersection[0], pointOfIntersection[1],shapeColor,'',true)
	}

	console.log('new intersection at', pointOfIntersection, firstLine.id(), secondLine.id())
}

// return angle in degree
function getIntersectionAngle(l1, pointOfIntersection, l2){
	var P1furthestPoint = getFurthestPointFrom(l1, pointOfIntersection)
	var P2furthestPoint = getFurthestPointFrom(l2, pointOfIntersection)

	var angle = findAngle3Points(P1furthestPoint[0],P1furthestPoint[1],
		pointOfIntersection[0],pointOfIntersection[1],
		P2furthestPoint[0],P2furthestPoint[1])

	return angle * 180 / Math.PI
}

function getIntersectionResultant(l1, pItx, l2){
	var p1f = getFurthestPointFrom(l1, pItx)
	var p2f = getFurthestPointFrom(l2, pItx)

	var d1x = p1f[0] - pItx[0];
	var d2x = p2f[0] - pItx[0];
	var d1y = p1f[1] - pItx[1];
	var d2y = p2f[1] - pItx[1]

	return [d1x+d2x, d1y+d2y]
}

function getHorizonVector(l1, pItx, l2) {
	var p1f = getFurthestPointFrom(l1, pItx)
	var p2f = getFurthestPointFrom(l2, pItx)

	var d1x = p1f[0] - pItx[0];
	var d2x = p2f[0] - pItx[0];
	var d1y = p1f[1] - pItx[1];
	var d2y = p2f[1] - pItx[1]

	var refPoint = p1f
	if (math.abs(d2y) < math.abs(d1y))
		refPoint = p2f

	return refPoint
}

function getFurthestPointFrom(l, pIntersect){
	if ( math.distance([l[0], l[1]], [pIntersect[0], pIntersect[1]]) >=
		math.distance([l[2], l[3]], [pIntersect[0], pIntersect[1]]))
		return [l[0], l[1]]
	else
		return [l[2], l[3]]
}

// p1 the corner , find angle 2 points in radian
function findAngle2Points(p1x,p1y,p2x,p2y) {
	return  Math.atan2(p2y - p1y, p2x - p1x)* 180 / Math.PI;;
}

// p1 the corner , find angle in radian
function findAngle3Points(p0x,p0y,p1x,p1y,p2x,p2y) {
	var a = Math.pow(p1x-p0x,2) + Math.pow(p1y-p0y,2),
		b = Math.pow(p1x-p2x,2) + Math.pow(p1y-p2y,2),
		c = Math.pow(p2x-p0x,2) + Math.pow(p2y-p0y,2);

	return Math.acos( (a+b-c) / Math.sqrt(4*a*b) );
}

// Primitive Function
function createIntersectionPoint(x,y,r, l1name, l2name, angle, resultant, horizonVector, shapecolor='', customlabel=''){

	// convert Point Index to alphabet character, 1, 2,3 to  point A, point B, point C
	var pointIndex =intersectionGroup.getChildren().length+1
	var pointIndexInAlphacharacter = (pointIndex + 9).toString(36).toUpperCase();
	var color = shapeColor==''? 'red':shapeColor
	var intersectionName= 'itx-'+pointIndexInAlphacharacter;

	var intersectionPoint = new Konva.Circle({
		x: x ,
		y: y ,
		radius: 3,
		stroke: color,
		name: 'itx-'+l1name+'-'+l2name,
		id:l1name+'-'+l2name,
	});
	intersectionGroup.add(intersectionPoint);

	// Draw Arc
	var xDirection = (horizonVector[0]-x)>= 0? 1: -1
	var yDirection = resultant[1]>= 0? 1: -1
	let rotation = findAngle2Points(x,y, horizonVector[0],horizonVector[1])
	if ( xDirection != yDirection ) { // x Axis and yAxis not equally positive or negative
		rotation = rotation-angle
	}

	var intersectionArc = new Konva.Arc({
		x:x,
		y:y,
		innerRadius: 0,
		outerRadius: 50,
		rotation:rotation,
		angle: angle,
		// fill: 'yellow',
		stroke: color,
		strokeWidth: 2,
	});
	intersectionGroup.add(intersectionArc);

	// var horizonVectorLine = new Konva.Line({
	//   stroke: 'red',
	//   listening: false,
	//   // points: [x, y, x+30*ratio*xDirection, y+30*yDirection],
	//   points: [x,y, horizonVector[0],horizonVector[1]]
	// });
	// intersectionGroup.add(horizonVectorLine);

	var intersectionAngle = new Konva.Text({
		x: x,
		y: y,
		text: angle.toFixed(2)+'°',
		fontSize: 13,
		fontFamily: 'Calibri',
		fill: color,
		align: 'left',
		id:'angle-itx-'+l1name+'-'+l2name,
		name: 'angle-itx-'+l1name+'-'+l2name
	});
	intersectionAngle.x(x - intersectionAngle.width()/2  + 20* xDirection)
	intersectionAngle.y(y - intersectionAngle.height()/2 + 20* yDirection)
	intersectionLabelGroup.add(intersectionAngle)

	var itxlabel = 'itx-'+pointIndexInAlphacharacter+'-L('+l1name.replace('line-','')+','+l2name.replace('line-','')+')'
	if( customlabel != '' )
		itxlabel = customlabel
	var intersectionLabel = new Konva.Text({
		x: x,
		y: y,
		text: itxlabel,
		fontSize: 12,
		fontFamily: 'Calibri',
		fill: color,
		align: 'center',
		id:'label-itx-'+l1name+'-'+l2name,
		name: 'label-itx-'+l1name+'-'+l2name
	});

	intersectionLabel.x(x - (8+intersectionLabel.width()/2)*xDirection)
	intersectionLabel.y(y - (8+intersectionLabel.height()/2)*yDirection)
	intersectionLabelGroup.add(intersectionLabel)
}


/**
 *  Procedure to Run Protocol
 */
const procedureASteps = [
	{name: "procedureA0", action:"circle", 	label:"A",  desc:"A concentric circle is drawn within the femoral head. The centre of this circle is marked as point A"},
	{name: "procedureA1", action:"point", 	label:"B",  desc:"The apex of the intercondylar notch is marked as point B"},
	{name: "procedureA2", action:"line", 	label:"1", mode:"connectPoints", from:0, to:1,	 desc:"Points A and B are connected to form Line 1 (mechanical axis of femur)"},
	{name: "procedureA3", action:"point", 	label:"C",  desc:"The most distal point of the medial femoral condyle convexity is marked as point C (avoiding osteophytes)"},
	{name: "procedureA4", action:"point", 	label:"D",  desc:"The most distal point of the lateral femoral condyle convexity is marked as point D (avoiding osteophytes)"},
	{name: "procedureA5", action:"line", 	label:"2", mode:"connectPoints",  from:3, to:4,  desc:"Points C and D are connected to form Line 2 (femoral knee joint orientation line)"},
	{name: "procedureA6", action:"computeAngle", label:"mLDFA", mode:"computeAngle", from:2, to:5,  desc:"The lateral angle between Lines 1 and 2 is the mechanical lateral distal femoral angle (mLDFA)"},
	{name: "procedureA7", action:"line", 	label:"3",  desc:"Line 3 (tibial knee joint orientation line) is the line of best fit between the medial and lateral tibial plateaus"},
	{name: "procedureA8", action:"computeMidPoint", 	mode:"computeMidPoint", from:7,	label:"E",  desc:"The centre of the tibial interspinous groove is marked as point E"},
	{name: "procedureA9", action:"point", 	label:"F",  desc:"The medial limit of the talar dome articular surface is marked as point F"},
	{name: "procedureA10", action:"point", 	label:"G",  desc:"The lateral limit of the talar dome articular surface is marked as point G"},
	{name: "procedureA11", action:"point", 	mode:"computeMidPoint", from:9, to:10, label:"H",  desc:"The midpoint between points F and G is marked as point H"},
	{name: "procedureA12", action:"line", 	label:"1", mode:"connectPoints", from:8, to:11,		label:"A",  desc:"Points E and H are connected to form Line 4"},
	{name: "procedureA13", action:"computeAngle", label:"mLDFA", mode:"computeAngle", from:7, to:12, label:"mMPTA",  desc:"The medial angle between lines 3 and 4 is the mechanical medial proximal tibial angle (mMPTA)"},
]

const procedureBSteps = [
	{name: "procedureB0", action:"line", label:"1",	 desc:"Line 1 is drawn tangential to the deepest point of the medial tibial plateau depression"},
	{name: "procedureB1", action:"circle", label:"α",  desc:"Circle α is drawn with the centre just distal to the tibial tuberosity so that it is simultaneously tangent to the anterior and posterior outer cortices"},
	{name: "procedureB2", action:"circle", label:"β",  desc:"Circle β is drawn just proximal to the distal tibial metaphyseal flare so that it is simultaneously tangent to the anterior and posterior outer cortices"},
	{name: "procedureB3", action:"line", label:"2", from:1, to:2, mode:"connectPoints",	 desc:"The centres of circles α and β are connected to form Line 2 (Central anatomical axis)"},
	{name: "procedureB4", action:"computeAngle", mode:"computeAngle", label:"aPPTA",from:0, to:3,  desc:"The acute angle between Lines 1 and 2 is the anatomical posterior proximal tibial angle (aPPTA). The compliment angle to aPPTA is the posterior tibial slope (PTS). i.e PTS = 90-aPPTA. "},
	{name: "procedureB5", action:"circle",  label:"γ",  desc:"Circle γ is drawn with the centre at mid-tibial length so that it is simultaneously tangent to the anterior and posterior outer cortices"},
	{name: "procedureB6", action:"line",  mode:"connectPoints",label:"3", from:1, to:5,	 desc:"The centres of circles α and γ are connected to form Line 3 (Proximal anatomical axis)."},
	{name: "procedureB7", action:"computeAngle", mode:"computeAngle", label:"paPTS ",from:0, to:6,  desc:"The acute angle between Lines 1 and 3 is the anatomical posterior proximal tibial angle to the proximal anatomical axis (paPPTA). paPTS = 90 - paPPTA"},
]

var stateProcedure = {
	currentSteps: 0,
	procedures: []
}

function chooseProtocol(procedures)
{
	resetProtocol()
	stateProcedure.procedures = procedures
	highlightStepProtocol(stateProcedure.currentSteps)
}

function resetProtocol()
{
	stateProcedure.currentSteps = 0
	stateProcedure.procedures = []
	return stateProcedure
}

function runProtocol()
{
	if(stateProcedure.procedures.length == 0 ){
		return null
	}

	if(stateProcedure.currentSteps > stateProcedure.procedures.length-1){
		return {}
	}else{
		target = stateProcedure.procedures[stateProcedure.currentSteps]
		highlightStepProtocol(stateProcedure.currentSteps)

		return target
	}

}

function highlightStepProtocol(step,isPermanent=false)
{
	console.log("highlight", stateProcedure, step, isPermanent)

	if(stateProcedure.procedures.length > 0 && step < stateProcedure.procedures.length){

		// Highlight next Action in Protocol
		if(isPermanent){
			$( "#"+stateProcedure.procedures[step].name).addClass("highlightpermanent");
		}else{
			$( "#"+stateProcedure.procedures[step].name).addClass("highlight");
		}

		if(step>0) {
			$("#" + stateProcedure.procedures[step-1].name).removeClass("highlight");
		}

	}
}

function getPointFromProcedure(proc)
{
	if (proc.action == "circle"){
		return prod.data[0]
	}else if(prod.action == "point"){
		return prod.data[0]
	}else if(prod.action == "line"){
		return prod.data[0]
	}

}

function moveToNextProcedure()
{
	console.log("stateProcedure.procedures.length ", stateProcedure.procedures.length)
	if(stateProcedure.procedures.length > 0 && stateProcedure.currentSteps <stateProcedure.procedures.length-1)
	{
		stateProcedure.currentSteps += 1

		target = stateProcedure.procedures[stateProcedure.currentSteps]
		console.log("target action :",target.action, drawmode)
		if(target.mode == "connectPoints"){
			console.log(target.mode, target.from, target.to)
			var Point1 = stateProcedure.procedures[target.from].data[1] //getShapeCenter
			var Point2 = stateProcedure.procedures[target.to].data[1] //getShapeCenter
			var data = startDrawLine(Point1.x(), Point1.y(), Point2.x(), Point2.y(), shapeColor);
			storeDataToCurrentProcedure(data[0], data[1], data[2]);
			highlightStepProtocol(stateProcedure.currentSteps, true)
			moveToNextProcedure()
		}else if(target.mode == "computeAngle"){
			console.log(target.mode, target.from, target.to)
			console.log("from", stateProcedure.procedures[target.from].data)
			console.log("to", stateProcedure.procedures[target.to].data)
			var line1 = stateProcedure.procedures[target.from].data[0] //getShape
			var line2 = stateProcedure.procedures[target.to].data[0] //getShape
			console.log("line1, line1", line1.points(), line2.points(), target.label)
			findTwoLinesIntersection(line1, line2, true, ''+target.label )
			highlightStepProtocol(stateProcedure.currentSteps, true)
			moveToNextProcedure()
			return;
		}else if(target.mode == "computeMidPoint"){
			console.log(target.mode, target.from, target.to)
			if(target.from){
				var cF = stateProcedure.procedures[target.from].data[1] //getShapeCenter
				lx = cF.x(), ly = cF.y()
				if(target.to){
					var cT = stateProcedure.procedures[target.to].data[1] //getShapeCenter
					lx = lx + (cT.x()-lx)/2;
					ly = ly + (cT.y()-ly)/2

					startDrawLine(cF.x(), cF.y(), cT.x(), cT.y(),shapeColor,'',true)

				}


				var data = createCircle(lx, ly,3, shapeColor, target.label )
				storeDataToCurrentProcedure(data[0], data[1], data[2]);
				highlightStepProtocol(stateProcedure.currentSteps, true)
				moveToNextProcedure()
			}
		}

	}

	findLineIntersections()

}

function storeDataToCurrentProcedure(shape, shapeCenter, shapeName)
{
	stateProcedure.procedures[stateProcedure.currentSteps].data = [ shape, shapeCenter, shapeName]
}

function UpdateProtocol()
{
	if(stateProcedure.procedures.length > 0 && stateProcedure.currentSteps < stateProcedure.procedures.length){
		if(drawmode == 'line'){
			storeDataToCurrentProcedure(line,currentShapeCenter,currentShapeName )
		}else if(drawmode == 'circle'){
			storeDataToCurrentProcedure(circle,currentShapeCenter,currentShapeName )
		}else if(drawmode == 'point'){
			storeDataToCurrentProcedure(circle,currentShapeCenter,currentShapeName )
		}

	}

	moveToNextProcedure()
	highlightStepProtocol(stateProcedure.currentSteps)
}

function showProtocolUI(target){
	switch (target) {
		case "A":
			$( "#protocolB" ).dialog( "close" );
			$( "#protocolA" ).dialog( "open" )
			$( "#protocolA" ).dialog({position: { my: "right bottom", at: "right bottom", of: window }});
			$( '#protocolA').parent().css({position:"fixed"});

			// Dirty method refresihing position call twice
			$( "#protocolB" ).dialog( "close" );
			$( "#protocolA" ).dialog( "open" )
			$( "#protocolA" ).dialog({position: { my: "right bottom", at: "right bottom", of: window }});
			$( '#protocolA').parent().css({position:"fixed"});

			chooseProtocol(procedureASteps)

			$( "#toolbox" ).hide();

			break;
		case "B":
			$( "#protocolA").dialog( "close" );
			$( "#protocolB" ).dialog( "open" );
			$( "#protocolB" ).dialog({position: { my: "right bottom", at: "right bottom", of: window }});
			$( '#protocolB').parent().css({position:"fixed"});

			// Dirty method refresihing position call twice
			$( "#protocolA").dialog( "close" );
			$( "#protocolB" ).dialog( "open" );
			$( "#protocolB" ).dialog({position: { my: "right bottom", at: "right bottom", of: window }});
			$( '#protocolB').parent().css({position:"fixed"});

			chooseProtocol(procedureBSteps)
			$( "#toolbox" ).hide();
			break;
		case "G":
			$( "#toolbox" ).show();
			$( "#protocolA").dialog( "close" );
			$( "#protocolB" ).dialog( "close" );
			resetProtocol()
			drawmode = getDrawMode()
			break;
	}
}
showProtocolUI("A");

initialize();
