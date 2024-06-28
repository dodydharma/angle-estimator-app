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
let intersectionArc
let intersectionPoint
let intersectionAngle
let intersectionLabel
let invertAngleDirection = false

let cursor;
let originClickPosition;
let currentShapeName;
let currentShapeCenter;
let currentLabel;
let mouseCurrentPosition


$('#reset').click(function() {
	location.reload();
});

$( "#selectProtocol" ).selectmenu(
	{
		change: function( event, data ) {
			console.log(data.item.value)
			showProtocolUI(data.item.value);
		}
	}
);

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
let lastShapeName;
let lastShapeCenter;

let lastIntersectionArc
let lastIntersectionPoint
let lastIntersectionAngle
let lastIntersectionLabel

$("#undo").button();
$("#undo" ).button( "option", "disabled", true );


$("#undo" ).on( "click", function( event ) {
	executeUndo();
	event.preventDefault();
} );


function activateUndo(){
	lastShape = circle?  circle: line
	lastLabel = currentLabel
	lastShapeName = currentShapeName
	lastShapeCenter = currentShapeCenter

	lastIntersectionArc =  intersectionArc
	lastIntersectionPoint = intersectionPoint
	lastIntersectionAngle =  intersectionAngle
	lastIntersectionLabel = intersectionLabel

	$("#goBackwardButtonA" ).prop('disabled', false);
	$("#goBackwardButtonB" ).prop('disabled', false);


}

function executeUndo(){
	console.log("execute Undo")
	if(lastLabel){
		lastLabel.destroy()
	}

	if(lastShape){
		lastShape.destroy()
	}

	if(lastShapeCenter){
		lastShapeCenter.destroy()
	}

	if(lastIntersectionArc){
		lastIntersectionArc.destroy()
	}
	if(lastIntersectionPoint){
		lastIntersectionPoint.destroy()
	}
	if(lastIntersectionAngle){
		lastIntersectionAngle.destroy()
	}
	if(lastIntersectionLabel){
		lastIntersectionLabel.destroy()
	}

	clearUndo()
}

function clearUndo(){
	console.log("clear Undo")
	lastLabel = null

	lastShape = null

	lastShapeCenter = null
	lastShapeName = null

	lastIntersectionArc = null
	lastIntersectionPoint = null
	lastIntersectionAngle = null
	lastIntersectionLabel = null

	$( "#undo" ).button( "option", "disabled", true );
	$("#goBackwardButtonA" ).prop('disabled', true);
	$("#goBackwardButtonB" ).prop('disabled', true);
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

let isWaitingForUpdateProtocol = false
function goNextStepAfterWaiting()
{
	if(isWaitingForUpdateProtocol){
		console.log("goNextStepAfterWaiting")
		clearUndo()
		updateProtocol();
	}
}

$( "#goForwardButtonA" ).on( "click", function(event) {
	goNextStepAfterWaiting()
	event.preventDefault();
});
$("#goForwardButtonA" ).prop('disabled', true);

$( "#goForwardButtonB" ).on( "click", function(event) {
	goNextStepAfterWaiting()
	event.preventDefault();
});
$("#goForwardButtonB" ).prop('disabled', true);


$( "#goBackwardButtonA" ).on( "click", function(event) {
	if(isWaitingForUpdateProtocol){
		executeUndo();
		$("#goBackwardButtonA" ).prop('disabled', true);
		$("#goBackwardButtonB" ).prop('disabled', true);
	}
	event.preventDefault();
});
$("#goBackwardButtonA" ).prop('disabled', true);
$( "#goBackwardButtonB" ).on( "click", function(event) {
	if(isWaitingForUpdateProtocol){
		executeUndo();
		$("#goBackwardButtonA" ).prop('disabled', true);
		$("#goBackwardButtonB" ).prop('disabled', true);

	}
	event.preventDefault();
});
$("#goBackwardButtonB" ).prop('disabled', true);

let autoForward =  false;
// let autoForward =  $("#isAutoForward").is(":checked");
$('#isAutoForwardA').change(function() {
	autoForward = this.checked
	if(autoForward)
		$("#goForwardButtonA" ).prop('disabled', true);
	else if(isWaitingForUpdateProtocol)
		$("#goForwardButtonA" ).prop('disabled', false);

});
$("#goForwardButtonA" ).prop('disabled', autoForward);

$('#isAutoForwardB').change(function() {
	autoForward = this.checked
	if(autoForward)
		$("#goForwardButtonB" ).prop('disabled', true);
	else if(isWaitingForUpdateProtocol)
		$("#goForwardButtonB" ).prop('disabled', false);

});
$("#goForwardButtonB" ).prop('disabled', autoForward);




window.addEventListener('keydown',function (e) {
		console.log("keyboard pressed", e.keyCode, "is waiting ", isWaitingForUpdateProtocol)

		if(e.keyCode == 32){ // space
			goNextStepAfterWaiting()
		}else if(e.keyCode == 8){ // backspace
			if(isWaitingForUpdateProtocol){
				executeUndo();
			}
		}else if(e.keyCode == 37){ // left
			if(isWaitingForUpdateProtocol){
				redrawInvertedIntectionAngle(runProtocol())
			}
		}else if(e.keyCode == 39){ // right
			if(isWaitingForUpdateProtocol){
				redrawInvertedIntectionAngle(runProtocol())
			}
		}

		e.preventDefault();
	},
	false);



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
		opacity:0.5,
		dash: dashProp,
	});

	currentShapeCenter = new Konva.Circle({
		x: xF+(xT-xF)/2,
		y: yF+(yT-yF)/2,
		radius: 1,
		// stroke: 'black',
		fill: 'black',
		name: 'center-'+currentShapeName,
		id:'center-'+currentShapeName,
		listening: false
	});
	centerGroup.add(currentShapeCenter);

	currentLabel  = new Konva.Label({
		x: xF+(xT-xF)/2,
		y: yF+(yT-yF)/2,
		opacity: 0.75,
	});

	currentLabel.add(
		new Konva.Tag({
			// fill: 'yellow',
			pointerDirection:  'up',
			pointerWidth: 15,
			pointerHeight: 7,
			lineJoin: 'round',
			shadowColor: 'black',
			shadowBlur: 10,
			shadowOffsetX: 5,
			shadowOffsetY: 5,
			shadowOpacity: 0.5,
			// stroke:'yellow',
			// strokeWidth:0.5,
			// dash:[3,4],
		})
	);


	currentLabel.add(
		new Konva.Text({
			text: currentShapeName.replace('line-','          ln-'),
			fontSize: 13,
			fontFamily: 'Calibri',
			fill: color?color:lineColor,
			stroke: 'black',
			strokeWidth: 0.2,
			align: 'left',
			id:'label-line-'+(lineGroup.children.length+1)
		})
	)

	labelGroup.add(currentLabel)

	if(dashed)
		dashedLineGroup.add(line)
	else lineGroup.add(line);

	console.log("activate undo draw line")
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
		radius: 2,
		stroke: 'yellow',
		fill: 'black',
		name: 'center-'+currentShapeName,
		id:'center-'+currentShapeName,
		listening: false
	});
	centerGroup.add(currentShapeCenter);

	currentLabel  = new Konva.Label({
		x: x,
		y: y,
		opacity: 0.75,
	});

	currentLabel.add(
		new Konva.Tag({
			// fill: 'yellow',
			pointerDirection:  'down',
			pointerWidth: 15,
			pointerHeight: 7,
			lineJoin: 'round',
			shadowColor: 'black',
			shadowBlur: 10,
			shadowOffsetX: 5,
			shadowOffsetY: 5,
			shadowOpacity: 0.5,
			// stroke:'yellow',
			// strokeWidth:0.5,
			// dash:[3,4],
		})
	);


	currentLabel.add(
		new Konva.Text({
		text: currentShapeName.replace("point-", '          pt-'),
		fontSize: 13,
		fontFamily: 'Calibri',
		fill: color,
		stroke: 'black',
		strokeWidth: 0.2,
		align: 'center',
		id:'label-'+currentShapeName
		})
	)
	// currentLabel.offsetX(currentLabel.width() / 2);
	currentLabel.x(x)
	currentLabel.y(y)
	labelGroup.add(currentLabel)

	circle.on('mousedown', (e) => {
		// if(isWaitingForUpdateProtocol){
		// 	executeUndo()
		// 	return false
		// }

		if(drawmode == 'line')
		{
			// get circle's center coordinate relative to the Image
			const pos = e.target.getAbsolutePosition(stage)
			originClickPosition = pos;
			startDrawLine(pos.x, pos.y, pos.x, pos.y,shapeColor);

			console.log("activate undo")
		}else if(drawmode == 'delete'){
			e.target.destroy()
			labelGroup.getChildren().forEach(deleteTargetLabel);
			function deleteTargetLabel(label, index, array){
				if(label.text() == e.target.name())
					label.destroy();
			}
			console.log("activate undo")
		}


	});

	console.log("activate undo draw circle")
	activateUndo();

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
			console.log('isWaitingForUpdateProtocol :',isWaitingForUpdateProtocol )

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
				if(isWaitingForUpdateProtocol){
					executeUndo()
				}

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


				if(drawmode == 'projectPointToALine')
				{
					var ln = stateProcedure.procedures[currentAction.from].data[0] //getLine
					p = findPointProjectionInALine([mouseCurrentPosition.x, mouseCurrentPosition.y], ln.points())
					console.log("projection of points ", [mouseCurrentPosition.x, mouseCurrentPosition.y], " to line ", ln.points(), "is at ", p)
					createCircle(p[0], p[1],3, shapeColor, currentAction.label )
				}

				if(drawmode == 'computeAngle'){
					redrawInvertedIntectionAngle(currentAction)
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
				currentLabel.x(lineLabelX)
				currentLabel.y(lineLabelY)
				// currentLabel.text( line.name()+' | '+ mouseDisplacementMagnitude.toFixed(2))

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
				currentLabel.x(currentShapeCenter.x())
				currentLabel.y(currentShapeCenter.y())

			}

			imageLayer.batchDraw();
			updatePreview();

		});

		stage.on('mouseup', (e) => {
			if(validateShape() == true){
				console.log("autoforward", autoForward)
				if(stateProcedure.procedures.length > 0 && stateProcedure.currentSteps < stateProcedure.procedures.length){
					storeDataToCurrentProcedure(lastShape,lastShapeCenter,lastShapeName )
				}

				if(autoForward) {
					console.log("updateProtocol after validate shape");
					updateProtocol()
				}else{
					waitingForUpdateProtocol();
				}
			}

			imageLayer.draw();

			// clear memory
			line = null;
			circle = null;
			currentLabel = null;
			currentShapeName = null;
			currentShapeCenter = null;
			intersectionArc =  null;
			intersectionPoint = null;
			intersectionAngle =  null;
			intersectionLabel = null;

		});


		function validateShape(){
			var result = true;
			if(line && drawmode == 'line'){
				ln = line.points()
				if(math.distance([ln[0], ln[1]], [ln[2],ln[3]]) <= 0){
					cancelDraw()
					console.log("validate ", drawmode, false)
					return false;
				}
			}

			if(circle && drawmode == 'circle'){
				console.log('radius ', circle.radius())
				if(circle.radius() <= 3){
					cancelDraw()
					console.log("validate ", drawmode, false)
					return false;
				}
			}

			if(drawmode == 'computeAngle'){
				console.log("validate ", drawmode, false)
				return false;
			}

			console.log("validate ", drawmode, true)
			return true;
		}

		function cancelDraw() {
			console.log('cancel draw')
			if (line ){line.destroy(); currentShapeCenter.destroy(), currentLabel.destroy()}
			if  (circle) circle.destroy();currentShapeCenter.destroy(); currentLabel.destroy();
		}


	}
}

function waitingForUpdateProtocol()
{
	console.log("waitingForUpdateProtocol , draw mode", drawmode)
	isWaitingForUpdateProtocol = true;
	$("#goForwardButton" ).prop('disabled', false);
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

function findLineIntersections(invert = false){
	var lines = lineGroup.getChildren();
	lines.forEach(checkEveryLine);
	function checkEveryLine(currentLine, currentLineIndex, otherLines) {
		otherLines.forEach(checkIntersection);
		function checkIntersection(otherLine, otherLineIndex, array) {
			// don't compare to self and only compare once
			if(currentLineIndex >  otherLineIndex){
				findTwoLinesIntersection(currentLine,otherLine, false, '' , invert)
			}
		}
	}
}

function findTwoLinesIntersection(currentLine,otherLine, inCludeOutSideLineRange = false, label= '', invert=false){
	var xy1 = currentLine.points();
	var xy2 = otherLine.points();
	var isIntersX = isIntersects(xy1[0], xy1[1], xy1[2], xy1[3], xy2[0], xy2[1], xy2[2], xy2[3])

	if(isIntersX){
		// check existing intersection rendering
		var itxID = currentLine.id()+'-'+otherLine.id()
		found = stage.find('#'+itxID)[0];
		if(!found){
			return generateIntersectionData(currentLine, otherLine, invert)
		}
	}else if(inCludeOutSideLineRange){
		var pointOfIntersection = math.intersect([xy1[0], xy1[1]], [xy1[2], xy1[3]], [xy2[0], xy2[1]], [xy2[2], xy2[3]])
		console.log("pointOfIntersection outside line",pointOfIntersection, label)
		// createCircle(pointOfIntersection[0],pointOfIntersection[1],5,'red')
		return generateIntersectionData(currentLine, otherLine, inCludeOutSideLineRange, label, invert)
	}

}


function generateIntersectionData(firstLine, secondLine, inCludeOutSideLineRange= false, label='', invert=false){
	console.log("  Generate Intersection Data with invert =", invert)
	var xy1 = firstLine.points();
	var xy2 = secondLine.points();

	var pointOfIntersection = math.intersect([xy1[0], xy1[1]], [xy1[2], xy1[3]], [xy2[0], xy2[1]], [xy2[2], xy2[3]])

	var intersectionResultant = getIntersectionResultant(xy1, pointOfIntersection, xy2)
	//var horizonAngle = getHorizonAngle(xy1, pointOfIntersection, xy2)
	var horizontalvector = getHorizonVector(xy1, pointOfIntersection, xy2, invert)
	var verticalVector = getVerticalVector(xy1, pointOfIntersection, xy2)
	// var intersectionAngle = getIntersectionAngle(xy1, pointOfIntersection, xy2)
	var intersectionAngle = findAngle3PointsInDegree(horizontalvector, pointOfIntersection, verticalVector)
	// console.log('horizontalvector, pointOfIntersection, verticalVector, intersectionAngle, invert', horizontalvector, pointOfIntersection, verticalVector, intersectionAngle,invert)

	if(inCludeOutSideLineRange){
		startDrawLine(verticalVector[0], verticalVector[1], pointOfIntersection[0], pointOfIntersection[1],shapeColor,'',true)
		startDrawLine(horizontalvector[0], horizontalvector[1], pointOfIntersection[0], pointOfIntersection[1],shapeColor,'',true)
	}

	var data = createIntersectionPoint(pointOfIntersection[0],pointOfIntersection[1],2, firstLine.id(), secondLine.id(),
		intersectionAngle, intersectionResultant, horizontalvector, shapeColor, label)


	return data
}

// return angle in degree
function getIntersectionAngle(l1, pointOfIntersection, l2){
	var P1furthestPoint = getFurthestPointFrom(l1, pointOfIntersection)
	var P2furthestPoint = getFurthestPointFrom(l2, pointOfIntersection)

	var angleInDegree = findAngle3PointsInDegree(P1furthestPoint[0],P1furthestPoint[1],
		pointOfIntersection[0],pointOfIntersection[1],
		P2furthestPoint[0],P2furthestPoint[1])

	return angleInDegree
}



function getIntersectionResultant(l1, pItx, l2, invert = false){
	var p1f = getFurthestPointFrom(l1, pItx)
	var p2f = getFurthestPointFrom(l2, pItx)

	var d1y = p1f[1] - pItx[1];
	var d2y = p2f[1] - pItx[1]

	// check whic is horizon first
	if (math.abs(d2y) < math.abs(d1y)){
		if (invert)
			p2f =  getFurthestPointFrom(l2, pItx, invert)
	}else{
		if(invert)
			p1f = getFurthestPointFrom(l1, pItx, invert)
	}

	var d1x = p1f[0] - pItx[0];
	var d2x = p2f[0] - pItx[0];

	return [d1x+d2x, d1y+d2y]
}

function getHorizonVector(l1, pItx, l2, invert= false) {
	var p1f = getFurthestPointFrom(l1, pItx)
	var p2f = getFurthestPointFrom(l2, pItx)

	var d1x = p1f[0] - pItx[0];
	var d2x = p2f[0] - pItx[0];
	var d1y = p1f[1] - pItx[1];
	var d2y = p2f[1] - pItx[1]

	if (math.abs(d2y) < math.abs(d1y)){
		if (invert)
			return getFurthestPointFrom(l2, pItx, invert)
		return p2f
	}

	if (invert)
		return getFurthestPointFrom(l1, pItx, invert)
	return p1f

}

function getVerticalVector(l1, pItx, l2) {
	var p1f = getFurthestPointFrom(l1, pItx)
	var p2f = getFurthestPointFrom(l2, pItx)

	var d1x = p1f[0] - pItx[0];
	var d2x = p2f[0] - pItx[0];
	var d1y = p1f[1] - pItx[1];
	var d2y = p2f[1] - pItx[1]

	if (math.abs(d2y) > math.abs(d1y)){
		return p2f
	}

	return p1f
}


function getFurthestPointFrom(l, pIntersect, invert= false){
	var compareDistance = math.distance([l[0], l[1]], [pIntersect[0], pIntersect[1]]) >=
		math.distance([l[2], l[3]], [pIntersect[0], pIntersect[1]])

	if ( compareDistance){
		if (invert)
			return [l[2], l[3]]
		return [l[0], l[1]]
	}
	else{
		if (invert)
			return [l[0], l[1]]
		return [l[2], l[3]]
	}
}

// p1 the corner , find angle 2 points in radian
function findAngle2Points(p1x,p1y,p2x,p2y) {
	return  Math.atan2(p2y - p1y, p2x - p1x)* 180 / Math.PI;;
}

function findAngle3PointsInDegree(p0,p1,p2){
	var angle = findAngle3Points(p0[0],p0[1],p1[0],p1[1],p2[0],p2[1])
	angleInDegree = angle * 180 / Math.PI
	return angleInDegree
}
// p1 the corner , find angle in radian
function findAngle3Points(p0x,p0y,p1x,p1y,p2x,p2y) {
	var a = Math.pow(p1x-p0x,2) + Math.pow(p1y-p0y,2),
		b = Math.pow(p1x-p2x,2) + Math.pow(p1y-p2y,2),
		c = Math.pow(p2x-p0x,2) + Math.pow(p2y-p0y,2);

	return Math.acos( (a+b-c) / Math.sqrt(4*a*b) );
}

function findPointProjectionInALine(point, line){

	abx = line[2]-line[0];
	aby = line[3]-line[1]
	acx = point[0]-line[0]
	acy = point[1]-line[1]

	coeff = (abx*acx + aby*acy) / (abx*abx+aby*aby)
	dx = line[0] + abx * coeff
	dy = line[1] + aby * coeff

	return [dx,dy]
}

// Primitive Function
function createIntersectionPoint(x,y,r, l1name, l2name, angle, resultant, horizonVector, shapecolor='', customlabel='', invert = false){

	// convert Point Index to alphabet character, 1, 2,3 to  point A, point B, point C
	var pointIndex = intersectionGroup.getChildren().length+1
	var pointIndexInAlphacharacter = (pointIndex + 9).toString(36).toUpperCase();
	var color = shapeColor==''? 'red':shapeColor
	var intersectionName= 'itx-'+pointIndexInAlphacharacter;


	// Draw Arc
	var yDirection = resultant[1]>= 0? 1: -1
	var xDirection = (horizonVector[0]-x)>= 0? 1: -1
	let rotation = findAngle2Points(x,y, horizonVector[0],horizonVector[1])
	if ( xDirection != yDirection ) { // x Axis and yAxis not equally positive or negative
		rotation = rotation-angle
	}

	intersectionArc = new Konva.Arc({
		x:x,
		y:y,
		innerRadius: 0,
		outerRadius: 50,
		rotation:rotation,
		angle: angle,
		// fill: 'yellow',
		opacity: 0.5,
		stroke: 'yellow',
		strokeWidth: 2,
		dash: [3,4]
	});
	intersectionGroup.add(intersectionArc);

	intersectionPoint = new Konva.Circle({
		x: x ,
		y: y ,
		radius: 2,
		stroke: 'yellow',
		fill: 'black',
		name: 'itx-'+l1name+'-'+l2name,
		id:l1name+'-'+l2name,
	});
	intersectionGroup.add(intersectionPoint);

	// var horizonVectorLine = new Konva.Line({
	//   stroke: 'red',
	//   listening: false,
	//   // points: [x, y, x+30*ratio*xDirection, y+30*yDirection],
	//   points: [x,y, horizonVector[0],horizonVector[1]]
	// });
	// intersectionGroup.add(horizonVectorLine);

	intersectionAngle = new Konva.Text({
		x: x,
		y: y,
		text: angle.toFixed(2)+'°',
		fontSize: 14,
		fontFamily: 'Calibri',
		fill: color,
		stroke: 'black',
		strokeWidth: 0.2,
		align: 'left',
		id:'angle-itx-'+l1name+'-'+l2name,
		name: 'angle-itx-'+l1name+'-'+l2name,

	});
	intersectionAngle.x(x - intersectionAngle.width()/2  + 20* xDirection)
	intersectionAngle.y(y - intersectionAngle.height()/2 + 20* yDirection)
	intersectionLabelGroup.add(intersectionAngle)

	intersectionLabel  = new Konva.Label({
		x: x,
		y: y,
		opacity: 0.75,
	});

	intersectionLabel.add(
		new Konva.Tag({
			// fill: 'yellow',
			pointerDirection: xDirection < 0? 'left':'right',
			pointerWidth: 15,
			pointerHeight: 7,
			lineJoin: 'round',
			shadowColor: 'black',
			shadowBlur: 10,
			shadowOffsetX: 5,
			shadowOffsetY: 5,
			shadowOpacity: 0.5,
			stroke:'yellow',
			strokeWidth:0.5,
			dash:[2,2],
			cornerRadius:7
		})
	);

	var itxlabel = ' its-'+pointIndexInAlphacharacter+'-L('+l1name.replace('line-','')+','+l2name.replace('line-','')+') '
	if( customlabel != '' )
		itxlabel = ' '+customlabel+' '

	intersectionLabel.add(
		new Konva.Text({
			// x: x,
			// y: y,
			text: itxlabel,//yDirection<0?'\n\n'+itxlabel+'\n\n',
			fontSize: 14,
			fontFamily: 'Calibri',
			fill: color,
			stroke: 'black',
			strokeWidth:0.3,
			align: 'center',
			id:'label-itx-'+l1name+'-'+l2name,
			name: 'label-itx-'+l1name+'-'+l2name
		})
	);

	intersectionLabel.x(x )//- (8+intersectionLabel.width()/2)*xDirection)
	intersectionLabel.y(y )//- (8+intersectionLabel.height()/2)*yDirection)
	intersectionLabelGroup.add(intersectionLabel)


	activateUndo()

	return [ intersectionArc, intersectionPoint, intersectionLabel, intersectionAngle];
}

function redrawInvertedIntectionAngle(targetProcedure)
{
	console.log("targetProcedure", targetProcedure)
	if(targetProcedure.action == "computeAngle"){
		if(isWaitingForUpdateProtocol)
			executeUndo()

		invertAngleDirection = !invertAngleDirection
		console.log(" invertAngleDirection", invertAngleDirection)
		console.log(target.mode, target.from, target.to)
		var line1 = stateProcedure.procedures[target.from].data[0] //getShape
		var line2 = stateProcedure.procedures[target.to].data[0] //getShape
		console.log(line1, line2)
		var data = findTwoLinesIntersection(line1, line2, true, ''+target.label , invertAngleDirection)
		storeDataToCurrentProcedure(data[0], data[1], data[2], data[4]);
		console.log("activate undo compute angle Fliped Arc")
		activateUndo()
	}

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
	{name: "procedureA8", action:"projectPointToALine", 	mode:"projectPointToALine", from:7,	label:"E",  desc:"The centre of the tibial interspinous groove is marked as point E"},
	{name: "procedureA9", action:"point", 	label:"F",  desc:"The medial limit of the talar dome articular surface is marked as point F"},
	{name: "procedureA10", action:"point", 	label:"G",  desc:"The lateral limit of the talar dome articular surface is marked as point G"},
	{name: "procedureA11", action:"computeMidPoint", 	mode:"computeMidPoint", from:9, to:10, label:"H",  desc:"The midpoint between points F and G is marked as point H"},
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
	console.log("run protocol ", stateProcedure.currentSteps ,  stateProcedure.procedures.length-1)
	if(stateProcedure.procedures.length == 0 ){
		return null
	}

	if(stateProcedure.currentSteps > stateProcedure.procedures.length-1){
		removeHighlightStepProtocol(stateProcedure.procedures.length-1)
		stopWaitingForUpdateProtocol()
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
			removeHighlightStepProtocol(step-1)
		}
	}

	if(step > stateProcedure.procedures.length-1){
		removeHighlightStepProtocol(stateProcedure.procedures.length-1)
	}
}

function removeHighlightStepProtocol(step){
	if(step>= 0 && step < stateProcedure.procedures.length){
		console.log('delete highlight on step ', step)
		$("#" + stateProcedure.procedures[step].name).removeClass("highlight")
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
	console.log("moveToNextProcedure()")
	var pendingMoveToNextProcedure = false;

	if(stateProcedure.procedures.length > 0){
		stateProcedure.currentSteps += 1
	}

	if(stateProcedure.currentSteps <stateProcedure.procedures.length-1)
	{
		console.log("stateProcedure.procedures.length ", stateProcedure.procedures.length, " stateProcedure.currentSteps ", stateProcedure.currentSteps)

		target = stateProcedure.procedures[stateProcedure.currentSteps]
		console.log("target action :",target.action, drawmode)

		if(target.mode == "connectPoints"){
			drawmode = target.mode
			console.log(target.mode, target.from, target.to)
			var Point1 = stateProcedure.procedures[target.from].data[1] //getShapeCenter
			var Point2 = stateProcedure.procedures[target.to].data[1] //getShapeCenter
			var data = startDrawLine(Point1.x(), Point1.y(), Point2.x(), Point2.y(), shapeColor);
			storeDataToCurrentProcedure(data[0], data[1], data[2]);
			highlightStepProtocol(stateProcedure.currentSteps, true)
			moveToNextProcedure()
		}else if(target.mode == "computeAngle"){
			drawmode = target.mode
			console.log(target.mode, target.from, target.to)
			console.log("from", stateProcedure.procedures[target.from].data)
			console.log("to", stateProcedure.procedures[target.to].data)
			var line1 = stateProcedure.procedures[target.from].data[0] //getShape
			var line2 = stateProcedure.procedures[target.to].data[0] //getShape
			var data = findTwoLinesIntersection(line1, line2, true, ''+target.label , invertAngleDirection)
			storeDataToCurrentProcedure(data[0], data[1], data[2], data[4]);
			console.log("activate undo on compute angle target mode")
			highlightStepProtocol(stateProcedure.currentSteps, true)

			if(autoForward){
				moveToNextProcedure()
			}else{
				waitingForUpdateProtocol()
			}
		}else if(target.mode == "computeMidPoint"){
			drawmode = target.mode
			console.log(target.mode, target.from, target.to, ' is Autoforward :', autoForward)
			if( target.from){
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

		}else if(target.mode == "projectPointToALine"){
			drawmode = target.mode
			console.log(target.mode, target.from, target.to, ' is Autoforward :', autoForward)
			if( target.from){
				var cF = stateProcedure.procedures[target.from].data[1] //getShapeCenter
				lx = cF.x(), ly = cF.y()
				var data = createCircle(lx, ly,3, shapeColor, target.label )
				storeDataToCurrentProcedure(data[0], data[1], data[2]);
				highlightStepProtocol(stateProcedure.currentSteps, true)
			}
			if(autoForward){
				moveToNextProcedure()
			}else{
				waitingForUpdateProtocol()
			}
		}else{
			stopWaitingForUpdateProtocol()
		}

	}

	if(stateProcedure.procedures.length <= 0){
		findLineIntersections()
	}

}

function stopWaitingForUpdateProtocol()
{
	console.log("stopWaitingForUpdateProtocol() ",isWaitingForUpdateProtocol )
	isWaitingForUpdateProtocol = false
	$("#goBackwardButtonA" ).prop('disabled', true);
	$("#goBackwardButtonB" ).prop('disabled', true);

}

function storeDataToCurrentProcedure(shape, shapeCenter, shapeName, shapeValue=null)
{
	stateProcedure.procedures[stateProcedure.currentSteps].data = [ shape, shapeCenter, shapeName, shapeValue]
}

function updateProtocol()
{
	console.log('updateProtocol()')
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

			autoForward =  $("#isAutoForwardA").is(":checked");

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

			autoForward =  $("#isAutoForwardB").is(":checked");

			chooseProtocol(procedureBSteps)
			$( "#toolbox" ).hide();
			break;
		case "G":
			$( "#toolbox" ).show();
			$( "#protocolA").dialog( "close" );
			$( "#protocolB" ).dialog( "close" );
			resetProtocol()
			autoForward = true
			drawmode = getDrawMode()
			break;
	}
}
showProtocolUI("A");

initialize();
