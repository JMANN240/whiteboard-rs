const whiteboard_id = new URLSearchParams(window.location.search).get('whiteboard_id')

var whiteboard = document.querySelector('#whiteboard');
var current_stroke = [];
var strokes = [];
var stroke_offset = [0, 0];
whiteboard.width = window.innerWidth;
whiteboard.height = window.innerHeight;

var resize_timeout;
window.addEventListener('resize', (e) => {
	drawStrokes(ctx, strokes, stroke_offset);
});

var ctx = whiteboard.getContext("2d");
ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--sec');
ctx.lineWidth = 3;
ctx.lineCap = "round";
ctx.lineJoin = "round";

var drawing = false;
var panning = false;

var drawStrokes = (context, strokes, offset) => {
	var prevStrokeStyle = context.strokeStyle;
	var prevLineWidth = context.lineWidth;
	whiteboard.width = window.innerWidth;
	whiteboard.height = window.innerHeight;
	for (const stroke of strokes) {
		drawPoints(context, stroke, offset);
	}
	context.strokeStyle = prevStrokeStyle;
	context.lineWidth = prevLineWidth;
}

var drawPoints = (context, stroke, offset) => {
	var {x1, y1, x2, y2, color, width} = stroke;
	if (color == '#ffffff' || color == '#000000') {
		context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--sec');
	} else if (color == 'erase') {
		context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--prim');
	} else {
		context.strokeStyle = color;
	}
	context.lineWidth = width;
	context.lineCap = "round";
	ctx.lineJoin = "round";
	context.beginPath();
	context.moveTo(x1 + offset[0], y1 + offset[1]);
	context.lineTo(x2 + offset[0], y2 + offset[1]);
	context.stroke();
}

var socket;

socket = io.connect({
	auth: {
		whiteboard_id
	}
});

socket.on('strokes', (s) => {
	strokes = s
	drawStrokes(ctx, strokes, stroke_offset);
});

if (getComputedStyle(document.documentElement).getPropertyValue('--sec') == '#ffffff') {
	document.querySelector('#sec-color').innerHTML = 'White';
} else if (getComputedStyle(document.documentElement).getPropertyValue('--sec') == '#202020') {
	document.querySelector('#sec-color').innerHTML = 'Black';
}

let erasing = false;

document.querySelectorAll('#colors-container > button').forEach(button => {
	button.addEventListener("click", (e) => {
		if (e.target.id == 'eraser-color') {
			ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--prim');
			ctx.lineWidth = 13;
			erasing = true;
		} else {
			ctx.lineWidth = 3;
			ctx.strokeStyle = window.getComputedStyle(e.target).color;
			erasing = false;
		}
	});
});

document.querySelector('#center-whiteboard').addEventListener("click", (e) => {
	stroke_offset = [0, 0];
	drawStrokes(ctx, strokes, stroke_offset);
});

document.querySelector('#clear-whiteboard').addEventListener("click", (e) => {
	socket.emit("clear");
});





let previous_screen_point;
let previous_whiteboard_point;

whiteboard.addEventListener("mousedown", (e) => {
	previous_screen_point = [e.clientX, e.clientY]
	previous_whiteboard_point = [e.clientX - stroke_offset[0], e.clientY - stroke_offset[1]];
});

whiteboard.addEventListener("mousemove", (e) => {
	let current_screen_point = [e.clientX, e.clientY]
	let current_whiteboard_point = [e.clientX - stroke_offset[0], e.clientY - stroke_offset[1]];

	if (e.buttons == 1) {
		const stroke = {
			whiteboard_id: whiteboard_id,
			x1: previous_whiteboard_point[0],
			y1: previous_whiteboard_point[1],
			x2: current_whiteboard_point[0],
			y2: current_whiteboard_point[1],
			color: erasing ? 'erase' : ctx.strokeStyle,
			width: ctx.lineWidth
		};

		ctx.beginPath();
		ctx.moveTo(previous_screen_point[0], previous_screen_point[1]);
		ctx.lineTo(current_screen_point[0], current_screen_point[1]);
		ctx.stroke();
		strokes.push(stroke);
		socket.emit('new-stroke', stroke);
	}
	if (e.buttons == 4) {
		movementX = current_screen_point[0] - previous_screen_point[0];
		movementY = current_screen_point[1] - previous_screen_point[1];
		stroke_offset[0] += movementX;
		stroke_offset[1] += movementY;
		drawStrokes(ctx, strokes, stroke_offset);
	}

	previous_screen_point = [e.clientX, e.clientY]
	previous_whiteboard_point = [e.clientX - stroke_offset[0], e.clientY - stroke_offset[1]];
});





document.addEventListener("touchdragstart", function (e) {
	whiteboard.dispatchEvent(
		new MouseEvent("mousedown", {
			clientX: e.detail.clientX,
			clientY: e.detail.clientY,
			button: e.detail.fingeredness - 1
		})
	);
});

document.addEventListener("touchdrag", function (e) {
	whiteboard.dispatchEvent(
		new MouseEvent("mousemove", {
			clientX: e.detail.clientX,
			clientY: e.detail.clientY,
			buttons: (e.detail.fingeredness == 1 ? 1 : 0) + (e.detail.fingeredness == 2 ? 4 : 0)
		})
	);
});