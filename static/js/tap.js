let fingeredness = 0;
let multiplicity = 0;
let variation = '';

const averagePoint = (touches) => {
    let average_point = [0, 0];

    for (const touch of touches) {
        average_point[0] += touch.clientX;
        average_point[1] += touch.clientY;
    }

    average_point[0] /= touches.length;
    average_point[1] /= touches.length;

	return average_point;
}

const dist = (p1, p2) => {
    dx = p1[0] - p2[0];
    dy = p1[1] - p2[1];

    return Math.sqrt(dx*dx + dy*dy);
}

const TAP_LENGTH = 250;
const HOLD_LENGTH = 250;

let tap_timeout;
let hold_timeout;

let current_fingers = 0;
const reset_multiplicity_fingeredness = () => {
    multiplicity = 0;
    fingeredness = 0;
}

let touch_start_point;

document.addEventListener("touchstart", function (e) {
    touch_start_point = averagePoint(e.touches);

    clearTimeout(tap_timeout);
    tap_timeout = setTimeout(() => {
        if (current_fingers == 0) {
            variation = 'tap';
            let tapEvent = new CustomEvent("tap", {
                detail: {
                    fingeredness: fingeredness,
                    multiplicity: multiplicity,
                    clientX: touch_start_point[0],
                    clientY: touch_start_point[1],
                    target: e.target
                }
            });
            document.dispatchEvent(tapEvent);
            reset_multiplicity_fingeredness();
        }
    }, TAP_LENGTH);

    clearTimeout(hold_timeout);
    hold_timeout = setTimeout(() => {
        if (current_fingers > 0) {
            variation = 'hold';
            let holdEvent = new CustomEvent("hold", {
                detail: {
                    fingeredness: fingeredness,
                    multiplicity: multiplicity,
                    clientX: touch_start_point[0],
                    clientY: touch_start_point[1],
                    target: e.target
                }
            });
            document.dispatchEvent(holdEvent);
        }
    }, HOLD_LENGTH);

    variation = '';
    if (current_fingers == 0) {
        multiplicity++;
    }
    current_fingers = e.touches.length;
    fingeredness = Math.max(e.touches.length, fingeredness);
});

let current_point;
let dragging = false;

document.addEventListener("touchmove", function (e) {
    current_point = averagePoint(e.touches);

    if (dist(touch_start_point, current_point) > 10) {
        if (!dragging) {
            let dragStartEvent = new CustomEvent("touchdragstart", {
                detail: {
                    fingeredness: fingeredness,
                    multiplicity: multiplicity,
                    clientX: touch_start_point[0],
                    clientY: touch_start_point[1],
                    target: e.target
                }
            });
            document.dispatchEvent(dragStartEvent);
        }
        dragging = true;
        clearTimeout(tap_timeout);
        clearTimeout(hold_timeout);
        variation = 'drag';
        if (fingeredness == e.touches.length) {
            let dragEvent = new CustomEvent("touchdrag", {
                detail: {
                    fingeredness: fingeredness,
                    multiplicity: multiplicity,
                    clientX: current_point[0],
                    clientY: current_point[1],
                    target: e.target
                }
            });
            document.dispatchEvent(dragEvent);
        }
    }

    e.preventDefault();
}, {passive: false});

document.addEventListener("touchend", function (e) {
    current_fingers = e.touches.length;

    if (current_fingers == 0) {
        if (variation == 'drag') {
            let dragEndEvent = new CustomEvent("touchdragend", {
                detail: {
                    fingeredness: fingeredness,
                    multiplicity: multiplicity,
                    clientX: current_point[0],
                    clientY: current_point[1],
                    target: e.target
                }
            });
            document.dispatchEvent(dragEndEvent);
            dragging = false;
        }
        if (variation == 'hold' || variation == 'drag') {
            reset_multiplicity_fingeredness();
        }
    }
});

document.addEventListener("tap", (e) => {
    console.log("[TAP]");
    console.log(`at ${e.detail.clientX}, ${e.detail.clientY}`);
    console.log(e);
})

document.addEventListener("hold", (e) => {
    console.log("[HOLD]");
    console.log(`at ${e.detail.clientX}, ${e.detail.clientY}`);
})

document.addEventListener("touchdragstart", (e) => {
    console.log("[DRAG START]");
    console.log(`at ${e.detail.clientX}, ${e.detail.clientY}`);
})

document.addEventListener("touchdrag", (e) => {
    console.log("[DRAG]");
    console.log(`at ${e.detail.clientX}, ${e.detail.clientY}`);
})

document.addEventListener("touchdragend", (e) => {
    console.log("[DRAG END]");
    console.log(`at ${e.detail.clientX}, ${e.detail.clientY}`);
})