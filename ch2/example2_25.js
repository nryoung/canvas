var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    eraseAllButton = document.getElementById('eraseAllButton'),
    strokeStyleSelect = document.getElementById('strokeStyleSelect'),
    startAngleSelect = document.getElementById('startAngleSelect'),
    fillStyleSelect = document.getElementById('fillStyleSelect'),
    fillCheckbox = document.getElementById('fillCheckbox'),
    sidesSelect = document.getElementById('sidesSelect'),

    drawingSurfaceImageData,
    mousedown = {},
    rubberbandRect = {},
    dragging = false,

    sides = 8,
    startAngle = 0,

    guidewires = true,

    Point = function (x, y) {
        this.x = x;
        this.y = y;
    };


// Funcs

function drawGrid(color, stepx, stepy) {
   context.save()

   context.strokeStyle = color;
   context.fillStyle = '#ffffff';
   context.lineWidth = 0.5;
   context.fillRect(0, 0, context.canvas.width, context.canvas.height);

   for (var i = stepx + 0.5; i < context.canvas.width; i += stepx) {
     context.beginPath();
     context.moveTo(i, 0);
     context.lineTo(i, context.canvas.height);
     context.stroke();
   }

   for (var i = stepy + 0.5; i < context.canvas.height; i += stepy) {
     context.beginPath();
     context.moveTo(0, i);
     context.lineTo(context.canvas.width, i);
     context.stroke();
   }

   context.restore();
}

function windowToCanvas(e) {
    var x = e.x || e.clientX,
        y = e.y || e.clientY,
        bbox = canvas.getBoundingClientRect();

    return { x: x - bbox.left * (canvas.width / bbox.width),
             y: y - bbox.top * (canvas.height / bbox.height)
           };
}

// Save and restore drawing surface
function saveDrawingSurface() {
    drawingSurfaceImageData = context.getImageData(0, 0,
                              canvas.width,
                              canvas.height);
}

function restoreDrawingSurface() {
    context.putImageData(drawingSurfaceImageData, 0, 0);
}

//Rubberbands
function updateRubberbandRectangle(loc) {
    rubberbandRect.width = Math.abs(loc.x - mousedown.x);
    rubberbandRect.height = Math.abs(loc.y - mousedown.y);

    if (loc.x > mousedown.x) {
        rubberbandRect.left = mousedown.x;
    } else {
        rubberbandRect.left = loc.x;
    }

    if (loc.y > mousedown.y) {
        rubberbandRect.top = mousedown.y;
    } else {
        rubberbandRect.top = loc.y;
        }
}

function getPolygonPoints(centerX, centerY, radius, sides, startAngle) {
    var points = [],
        angle = startAngle || 0;

    for (var i = 0; i < sides; ++i) {
        points.push(new Point(centerX + radius * Math.sin(angle),
                              centerY - radius * Math.cos(angle)));
        angle += 2*Math.PI/sides;
    }
    return points;
}

function createPolygonPath(centerX, centerY, radius, sides, startAngle) {
    var points = getPolygonPoints(centerX, centerY, radius, sides, startAngle);

    context.beginPath();

    context.moveTo(points[0].x, points[0].y);

    for (var i = 1; i < sides; ++i) {
        context.lineTo(points[i].x, points[i].y);
    }

    context.closePath();
}

function drawRubberbandShape(loc, sides, startAngle) {
    createPolygonPath(mousedown.x, mousedown.y,
                      rubberbandRect.width,
                      parseInt(sidesSelect.value),
                      (Math.PI / 180) * parseInt(startAngleSelect.value));
    context.stroke();

    if (fillCheckbox.checked) {
        context.fill();
    }
}

function updateRubberband(loc, sides, startAngle) {
    updateRubberbandRectangle(loc);
    drawRubberbandShape(loc, sides, startAngle);
}

// Guidewires

function drawHorizontalLine (y) {
    context.beginPath();
    context.moveTo(0, y+0.5);
    context.lineTo(context.canvas.width, y+0.5);
    context.stroke();
}

function drawVerticalLine (x) {
    context.beginPath();
    context.moveTo(x+0.5, 0);
    context.lineTo(x+0.5, context.canvas.height);
    context.stroke();
}

function drawGuidewires(x, y) {
    context.save();
    context.strokeStyle = 'rgba(0,0,230,0.4)';
    context.lineWidth = 0.5;
    drawVerticalLine(x);
    drawHorizontalLine(y);
    context.restore();
}

// Event Handlers

canvas.onmousedown = function (e) {
    var loc = windowToCanvas(e);

    saveDrawingSurface();

    e.preventDefault();

    saveDrawingSurface();
    mousedown.x = loc.x;
    mousedown.y = loc.y;
    dragging = true;
};

canvas.onmousemove = function (e) {
    var loc;

    if (dragging) {
        e.preventDefault();

        loc = windowToCanvas(e);
        restoreDrawingSurface();
        updateRubberband(loc, sides, startAngle);

        if (guidewires) {
            drawGuidewires(mousedown.x, mousedown.y);
        }
    }
};

canvas.onmouseup = function (e) {
    var loc = windowToCanvas(e);
    dragging = false;
    restoreDrawingSurface();
    updateRubberband(loc);
};

eraseAllButton.onclick = function (e) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid('lightgray', 10, 10);
    saveDrawingSurface();
};

strokeStyleSelect.onchange = function (e) {
    context.strokeStyle = strokeStyleSelect.value;
};

fillStyleSelect.onchange = function (e) {
    context.fillStyle = fillStyleSelect.value;
};

// Init

context.strokeStyle = strokeStyleSelect.value;
context.fillStyle = fillStyleSelect.value;
drawGrid('lightgray', 10, 10);
