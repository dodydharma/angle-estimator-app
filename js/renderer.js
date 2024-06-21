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

// Help Protocol information Dialog
$( "#protocolA" ).dialog({width : 650});
$( "#protocolA" ).dialog({position: { my: "right bottom", at: "right bottom", of: window }});
{$( "#protocolA" ).dialog( "close" );}
$( "#showProtocolA" ).on( "click", function(event) {
	$( "#protocolB" ).dialog( "close" );
	$( "#protocolA" ).dialog( "open" )
	$( "#protocolA" ).dialog({position: { my: "right bottom", at: "right bottom", of: window }});
	$( '#protocolA').parent().css({position:"fixed"});
	chooseProtocol(procedureASteps)
	event.preventDefault();
});

$( "#protocolB" ).dialog({width : 650});
$( "#protocolB" ).dialog({position: { my: "right bottom", at: "right bottom", of: window }});
{$( "#protocolB" ).dialog( "close" );}
$( "#showProtocolB" ).on( "click", function(event) {
	$( "#protocolA").dialog( "close" );
	$( "#protocolB" ).dialog( "open" );
	$( "#protocolB" ).dialog({position: { my: "right bottom", at: "right bottom", of: window }});
	$( '#protocolB').parent().css({position:"fixed"});
	chooseProtocol(procedureBSteps)
	event.preventDefault();
});


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
let imageViewResolution = 3000
var handle = $( "#custom-handle" );
$( "#slider" ).slider({
	create: function() {
		handle.text( 'view max '+imageViewResolution+' px' );
	},
	slide: function( event, ui ) {
		imageViewResolution = ui.value
		handle.text( 'view max '+imageViewResolution+' px' );
		if (url)
			initialize()
	},
	min: 500,
	value:imageViewResolution,
	max: 5000,
});


function downloadURI(uri, name) {
	var link = document.createElement('a');
	link.download = name;
	link.href = uri;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	delete link;
}

document.getElementById('save').addEventListener(
	'click',
	function () {
		var dataURL = stage.toDataURL({ pixelRatio: 3 });
		downloadURI(dataURL, 'angle-calculation.png');
	},
	false
);



// Primitive Function for drawing
function startDrawLine(xF,yF, xT,yT, color){
	currentShapeName =  'line-' + (lineGroup.getChildren().length+1)
	let lineColor = 'rgb(255,'+Math.floor(Math.random() *100)+55+','+Math.floor(Math.random() * 255)+')'

	line = new Konva.Line({
		stroke: color?color:lineColor,
		// remove line from hit graph, so we can check intersections
		listening: false,
		points: [xF, yF, xT, yT],
		name: currentShapeName,
		id: 'line-' + (lineGroup.children.length+1),
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
		x: xF,
		y: yF,
		text: currentShapeName,
		fontSize: 13,
		fontFamily: 'Calibri',
		fill: color?color:lineColor,
		align: 'left',
		id:'label-line-'+(lineGroup.children.length+1)
	});
	currentLabel.offsetX(currentLabel.width() / 2);
	labelGroup.add(currentLabel)
	lineGroup.add(line);

	activateUndo();

	return [line, currentShapeCenter, currentLabel];
}

// Primitive Function
function createCircle(x,y,r, color='red'){
	// convert Point Index to alphabet character, 1, 2,3 to  point A, point B, point C
	var pointIndex =pointGroup.getChildren().length+1
	var pointIndexInAlphacharacter = (pointIndex + 9).toString(36).toUpperCase();
	currentShapeName= 'point-'+pointIndexInAlphacharacter;

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
		// var ratio = (img_width > img_height ? (img_width / max) : (img_height / max))
		max = (img_width > img_height) ? max : (img_width > window.innerWidth) ? window.innerWidth : max

		var ratio = img_width/max

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
				setTimeout(function() {
					$( "#preview" ).css({left: window.innerWidth-(previewWidth +3)})

					if($('#protocolA').dialog('isOpen')){
						$( "#protocolA" ).dialog({position: { my: "right bottom", at: "right bottom", of: window }});
						$( '#protocolA').parent().css({position:"fixed"});
					}
					if($('#protocolB').dialog('isOpen')){
						$( "#protocolB" ).dialog({position: { my: "right bottom", at: "right bottom", of: window }});
						$( '#protocolB').parent().css({position:"fixed"});
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

			if(currentAction == null) // Free Draw
			{
				console.log("Free Draw")

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
				console.log("Execute ", currentAction)
				drawmode = currentAction.action
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
			}

			imageLayer.batchDraw();
			updatePreview();

		});

		stage.on('mouseup', (e) => {
			UpdateProtocol()
			activateUndo()
			findLineIntersections()
			imageLayer.draw();

			// clear memory
			line = null;
			circle = null;
			currentLabel = null;
			currentShapeName = null;
		});

		function cancelDraw() {
			console.log('cancel draw')
			if (line )line.destroy();
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
				}
			}
		}
	}
}

function generateIntersectionData(firstLine, secondLine){
	var xy1 = firstLine.points();
	var xy2 = secondLine.points();

	var pointOfIntersection = math.intersect([xy1[0], xy1[1]], [xy1[2], xy1[3]], [xy2[0], xy2[1]], [xy2[2], xy2[3]])

	var intersectionAngle = getIntersectionAngle(xy1, pointOfIntersection, xy2)
	var intersectionResultant = getIntersectionResultant(xy1, pointOfIntersection, xy2)
	//var horizonAngle = getHorizonAngle(xy1, pointOfIntersection, xy2)
	var horizontalvector = getHorizonVector(xy1, pointOfIntersection, xy2)

	createIntersectionPoint(pointOfIntersection[0],pointOfIntersection[1],2, firstLine.id(), secondLine.id(),
		intersectionAngle, intersectionResultant, horizontalvector)

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
function createIntersectionPoint(x,y,r, l1name, l2name, angle, resultant, horizonVector){
	// convert Point Index to alphabet character, 1, 2,3 to  point A, point B, point C
	var pointIndex =intersectionGroup.getChildren().length+1
	var pointIndexInAlphacharacter = (pointIndex + 9).toString(36).toUpperCase();
	var color = 'red'
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
		stroke: 'red',
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

	var intersectionLabel = new Konva.Text({
		x: x,
		y: y,
		text: 'itx-'+pointIndexInAlphacharacter+'-L('+l1name.replace('line-','')+','+l2name.replace('line-','')+')',
		fontSize: 9,
		fontFamily: 'Calibri',
		fill: color,
		align: 'center',
		id:'label-itx-'+l1name+'-'+l2name,
		name: 'label-itx-'+l1name+'-'+l2name
	});

	intersectionLabel.x(x - (7+intersectionLabel.width()/2)*xDirection)
	intersectionLabel.y(y - (7+intersectionLabel.height()/2)*yDirection)
	intersectionLabelGroup.add(intersectionLabel)
}


/**
 *  Procedure to Run Protocol
 */
const procedureASteps = [
	{name: "procedureA1", action:"circle", data:[], desc:"A concentric circle is drawn within the femoral head. The centre of this circle is marked as point A"},
	{name: "procedureA2", action:"point", 	data:[], desc:"The apex of the intercondylar notch is marked as point B"},
	{name: "procedureA3", action:"line", 	data:[], desc:"Points A and B are connected to form Line 1 (mechanical axis of femur)"},
	{name: "procedureA4", action:"point", 	data:[], desc:"A concentric circle is drawn within the femoral head. The centre of this circle is marked as point A"},
	{name: "procedureA5", action:"point", 	data:[], desc:"The most distal point of the medial femoral condyle convexity is marked as point C (avoiding osteophytes)"},
	{name: "procedureA6", action:"point", 	data:[], desc:"The most distal point of the lateral femoral condyle convexity is marked as point D (avoiding osteophytes)"},
	{name: "procedureA7", action:"line", 	data:[], desc:"Points C and D are connected to form Line 2 (femoral knee joint orientation line)"},
	{name: "procedureA8", action:"computeAngle", data:[], desc:"The lateral angle between Lines 1 and 2 is the mechanical lateral distal femoral angle (mLDFA)"},
	{name: "procedureA9", action:"line", 	data:[], desc:"Line 3 (tibial knee joint orientation line) is the line of best fit between the medial and lateral tibial plateaus"},
	{name: "procedureA10", action:"point", 	data:[], desc:"The centre of the tibial interspinous groove is marked as point E"},
	{name: "procedureA11", action:"point", 	data:[], desc:"The medial limit of the talar dome articular surface is marked as point F"},
	{name: "procedureA12", action:"point", 	data:[], desc:"The lateral limit of the talar dome articular surface is marked as point G"},
	{name: "procedureA13", action:"line", 	data:[], desc:"Points E and H are connected to form Line 4"},
	{name: "procedureA14", action:"computeAngle", data:[], desc:"The medial angle between lines 3 and 4 is the mechanical medial proximal tibial angle (mMPTA)"},
]

const procedureBSteps = [
	{name: "procedureB1", action:"line", 	data:[], desc:"Line 1 is drawn tangential to the deepest point of the medial tibial plateau depression"},
	{name: "procedureB2", action:"circle", data:[], desc:"Circle α is drawn with the centre just distal to the tibial tuberosity so that it is simultaneously tangent to the anterior and posterior outer cortices"},
	{name: "procedureB3", action:"circle", data:[], desc:"Circle β is drawn just proximal to the distal tibial metaphyseal flare so that it is simultaneously tangent to the anterior and posterior outer cortices"},
	{name: "procedureB4", action:"line", 	data:[], desc:"The centres of circles α and β are connected to form Line 2 (Central anatomical axis)"},
	{name: "procedureB5", action:"computeAngle", data:[], desc:"The acute angle between Lines 1 and 2 is the anatomical posterior proximal tibial angle (aPPTA). The compliment angle to aPPTA is the posterior tibial slope (PTS). i.e PTS = 90-aPPTA. "},
	{name: "procedureB6", action:"circle", data:[], desc:"Circle γ is drawn with the centre at mid-tibial length so that it is simultaneously tangent to the anterior and posterior outer cortices"},
	{name: "procedureB7", action:"line", 	data:[], desc:"The centres of circles α and γ are connected to form Line 3 (Proximal anatomical axis)."},
	{name: "procedureB8", action:"computeAngle", data:[], desc:"The acute angle between Lines 1 and 3 is the anatomical posterior proximal tibial angle to the proximal anatomical axis (paPPTA). paPTS = 90 - paPPTA"},
]

var stateProcedure = {
	currentSteps: 0,
	procedures: []
}

function chooseProtocol(procedures)
{
	resetProtocol()
	stateProcedure.procedures = procedures

	console.log(stateProcedure)

	UpdateProtocol()
}

function resetProtocol()
{
	stateProcedure.currentSteps = 0
	stateProcedure.procedures= []
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
		UpdateProtocol()
		console.log(stateProcedure);
		target = stateProcedure.procedures[stateProcedure.currentSteps]
		stateProcedure.currentSteps += 1

		return target
	}

}

function UpdateProtocol()
{
	if(stateProcedure.procedures.length > 0 && stateProcedure.currentSteps < stateProcedure.procedures.length){
		if(drawmode == 'line'){
			stateProcedure.procedures[stateProcedure.currentSteps].data = [currentShapeCenter, line, currentShapeName]
		}else if(drawmode == 'circle'){
			stateProcedure.procedures[stateProcedure.currentSteps].data = [currentShapeCenter, circle, currentShapeName]
		}else if(drawmode == 'point'){
			stateProcedure.procedures[stateProcedure.currentSteps].data = [currentShapeCenter, circle, currentShapeName]
		}

		// Highlight next Action in Protocol
		$( "#"+stateProcedure.procedures[stateProcedure.currentSteps].name).addClass("highlight");

		if(stateProcedure.currentSteps>0) {
			$("#" + stateProcedure.procedures[stateProcedure.currentSteps-1].name).removeClass("highlight");
		}

		// Check Next Step

	}


}



initialize();
