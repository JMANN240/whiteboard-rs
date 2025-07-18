const whiteboard_id = new URLSearchParams(window.location.search).get('whiteboard_id')

var whiteboard = document.querySelector('#whiteboard');
var current_stroke = [];
var strokes = [];
var stroke_offset = [0, 0];
whiteboard.width = window.innerWidth;
whiteboard.height = window.innerHeight;

var resize_timeout;
window.addEventListener('resize', (e) => {
	draw(ctx, strokes, stroke_offset);
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
	if (color == '#ffffff' || color == '#000000' || color == 'erase') {
		context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--sec');
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
	draw(ctx, strokes, stroke_offset);
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
			ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--sec');
			ctx.lineWidth = 3;
			erasing = true;
		} else {
			ctx.lineWidth = 3;
			ctx.strokeStyle = window.getComputedStyle(e.target).color;
			erasing = false;
		}

		draw(ctx, strokes, stroke_offset);
	});
});

document.querySelector('#center-whiteboard').addEventListener("click", (e) => {
	stroke_offset = [0, 0];
	draw(ctx, strokes, stroke_offset);
});

document.querySelector('#clear-whiteboard').addEventListener("click", (e) => {
	socket.emit("clear");
});





let previous_screen_point;
let previous_whiteboard_point;
let current_screen_point;
let current_whiteboard_point;

whiteboard.addEventListener("mousedown", (e) => {
	previous_screen_point = [e.clientX, e.clientY]
	previous_whiteboard_point = [e.clientX - stroke_offset[0], e.clientY - stroke_offset[1]];
});

whiteboard.addEventListener("mousemove", (e) => {
	current_screen_point = [e.clientX, e.clientY]
	current_whiteboard_point = [e.clientX - stroke_offset[0], e.clientY - stroke_offset[1]];

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

		if (!erasing) {
			ctx.beginPath();
			ctx.moveTo(previous_screen_point[0], previous_screen_point[1]);
			ctx.lineTo(current_screen_point[0], current_screen_point[1]);
			ctx.stroke();
			strokes.push(stroke);
		} else {
			strokes = strokes.filter(stroke => {
				const dx1 = stroke.x1 - current_whiteboard_point[0];
				const dy1 = stroke.y1 - current_whiteboard_point[1];
				const dx2 = stroke.x2 - current_whiteboard_point[0];
				const dy2 = stroke.y2 - current_whiteboard_point[1];

				return Math.sqrt(Math.pow(dx1, 2) + Math.pow(dy1, 2)) > 20 && Math.sqrt(Math.pow(dx2, 2) + Math.pow(dy2, 2)) > 20;
			});
		}

		socket.emit('new-stroke', stroke);
	}
	if (e.buttons == 4) {
		movementX = current_screen_point[0] - previous_screen_point[0];
		movementY = current_screen_point[1] - previous_screen_point[1];
		stroke_offset[0] += movementX;
		stroke_offset[1] += movementY;
	}

	draw(ctx, strokes, stroke_offset);

	previous_screen_point = [e.clientX, e.clientY]
	previous_whiteboard_point = [e.clientX - stroke_offset[0], e.clientY - stroke_offset[1]];
});

function draw(ctx, strokes, stroke_offset) {
	drawStrokes(ctx, strokes, stroke_offset);

	if (current_screen_point && erasing) {
		ctx.beginPath();
		ctx.arc(current_screen_point[0], current_screen_point[1], 20, 0, 2 * Math.PI);
		ctx.stroke();
	}
}





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