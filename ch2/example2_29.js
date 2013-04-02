var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    eraseAllButton = document.getElementById('eraseAllButton'),
    strokeStyleSelect = document.getElementById('strokeStyleSelect'),
    guidewireCheckbox = document.getElementById('guidewireCheckbox'),
    instructions = document.getElementById('instructions'),
    instructionsOkayButton = document.getElementById('instructionsOkayButton'),
    instructionsNoMoreButton = document.getElementById('instructionsNoMoreButton'),

    showInstructions = true,

    GRID_STROKE_STYLE = 'lightblue',
    GRID_SPACING = 10,

    CONTROL_POINT_RADIUS = 5,
    CONTROL_POINT_STROKE_STYLE = 'blue',
    CONTROL_POINT_FILL_STYLE = 'rgba(255, 255, 0, 0.5)',

    END_POINT_STROKE_STYLE = 'navy',
    END_POINT_FILL_STYLE = 'rgba(0, 255, 0, 0.5)',

    GUIDEWIRE_STROKE_STYLE = 'rgba(0, 0, 230, 0.4)',

    drawImageData,

    mousedown = {},
    rubberbandRect = {},

    dragging = false,
    draggingPoint = false,

    endPoints = [ {}, {} ],
    controlPoints = [ {}, {} ],
    editing = false,

    guidewires = guidewireCheckbox.checked;

// Functions

function drawGrid(color, stepx, stepy) {
   context.save()

   context.strokeStyle = color;
   context.lineWidth = 0.5;
   context.clearRect(0, 0, context.canvas.width, context.canvas.height);

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

function windowToCanvas(x, y) {
   // gives us the correct loc or offset of where an even happens
   var bbox = canvas.getBoundingClientRect();

   return { x: x - bbox.left * (canvas.width / bbox.width),
            y: y - bbox.top * (canvas.height / bbox.height)
          };
}

// Save and restore drawing surface...................................

function saveDrawingSurface() {
   drawingImageData = context.getImageData(0, 0,
                         canvas.width, canvas.height);
}

function restoreDrawingSurface() {
   context.putImageData(drawingImageData, 0, 0);
}

// Rubberbands........................................................

function updateRubberbandRectangle(loc) {
   rubberbandRect.width = Math.abs(loc.x - mousedown.x);
   rubberbandRect.height = Math.abs(loc.y - mousedown.y);

   if (loc.x > mousedown.x) rubberbandRect.left = mousedown.x;
   else rubberbandRect.left = loc.x;

   if (loc.y > mousedown.y) rubberbandRect.top = mousedown.y;
   else rubberbandRect.top = loc.y;
}

function drawBezierCurve() {
    //does the actual drawing of the curve
    context.beginPath();
    context.moveTo(endPoints[0].x, endPoints[0].y);
    context.bezierCurveTo(controlPoints[0].x, controlPoints[0].y,
                          controlPoints[1].x, controlPoints[1].y,
                          endPoints[1].x, endPoints[1].y);
    context.stroke();
}

function updateEndAndControlPoints() {
    endPoints[0].x = rubberbandRect.left;
    endPoints[0].y = rubberbandRect.top;

    endPoints[1].x = rubberbandRect.left + rubberbandRect.width;
    endPoints[1].y = rubberbandRect.top + rubberbandRect.height;

    controlPoints[0].x = rubberbandRect.left;
    controlPoints[0].y = rubberbandRect.top + rubberbandRect.height;

    controlPoints[1].x = rubberbandRect.left + rubberbandRect.width;
    controlPoints[1].y = rubberbandRect.top;
}

function drawRubberbandShape(loc) {
    updateEndAndControlPoints();
    drawBezierCurve();
}

function updateRubberband(loc) {
    updateRubberbandRectangle(loc);
    drawRubberbandShape(loc);
}

// Guidewires

function drawHorizontalGuidewire (y) {
   context.beginPath();
   context.moveTo(0, y + 0.5);
   context.lineTo(context.canvas.width, y + 0.5);
   context.stroke();
}

function drawVerticalGuidewire (x) {
   context.beginPath();
   context.moveTo(x + 0.5, 0);
   context.lineTo(x + 0.5, context.canvas.height);
   context.stroke();
}

function drawGuideWires(x, y) {
   context.save();
   context.strokeStyle = GUIDEWIRE_STROKE_STYLE;
   context.lineWidth = 0.5;
   drawVerticalGuidewire(x);
   drawHorizontalGuidewire(y);
   context.restore();
}

// End points and control points...

function drawControlPoint(index) {
    //does the actual drawing of the controlpoints
    context.beginPath();
    context.arc(controlPoints[index].x, controlPoints[index].y,
                CONTROL_POINT_RADIUS, 0, Math.PI*2, false);
    context.stroke();
    context.fill();
}

function drawControlPoints() {
    //calls the function to draw both control points
    context.save();
    context.strokeStyle = CONTROL_POINT_STROKE_STYLE;
    context.fillStyle = CONTROL_POINT_FILL_STYLE;

    drawControlPoint(0);
    drawControlPoint(1);

    context.stroke();
    context.fill();
    context.restore();
}

function drawEndPoint(index) {
    //does the actual drawing of the end point
    context.beginPath();
    context.arc(endPoints[index].x, endPoints[index].y,
                CONTROL_POINT_RADIUS, 0, Math.PI*2, false);
    context.stroke();
    context.fill();
}

function drawEndPoints() {
    //calls the functions to draw the end points
    context.save();
    context.strokeStyle = END_POINT_STROKE_STYLE;
    context.fillStyle = END_POINT_FILL_STYLE;

    drawEndPoint(0);
    drawEndPoint(1);

    context.stroke();
    context.fill();
    context.restore();
}

function drawControlAndEndPoints() {
    //name is pretty self describing
    drawControlPoints();
    drawEndPoints();
}

function cursorInEndPoint(loc) {
    var pt;

    // Iterates through both end points and creates a path
    // then tests to see if the loc passed in with in that path or
    // e.g. if onmousedown is on an endpoint
    endPoints.forEach( function(point) {
        context.beginPath();
        context.arc(point.x, point.y,
                    CONTROL_POINT_RADIUS, 0, Math.PI*2, false);

        if (context.isPointInPath(loc.x, loc.y)) {
            pt = point;
        }
    });
    return pt;
}

function cursorInControlPoint(loc) {
    var pt;
    
    // Iterates through both control points and creates a path.
    // then tests to see if loc passed in, is within that path
    // e.g. if onmousedown is on a controlpoint
    controlPoints.forEach( function(point) {
        context.beginPath();
        context.arc(point.x, point.y,
                    CONTROL_POINT_RADIUS, 0, Math.PI*2, false);

        if (context.isPointInPath(loc.x, loc.y)) {
            pt = point;
        }
    });

    return pt;
}

function updateDraggingPoint(loc) {
    // Going to be used for an event handler
    draggingPoint.x = loc.x;
    draggingPoint.y = loc.y;
}

// Event Handlers

canvas.onmousedown = function (e) {
    var loc = windowToCanvas(e.clientX, e.clientY);

    e.preventDefault();

    if (!editing) {
        saveDrawingSurface();
        mousedown.x = loc.x;
        mousedown.y = loc.y;
        updateRubberbandRectangle(loc);
        dargging = true;
    } else {
        draggingPoint = cursorInControlPoint(loc);
        if (!draggingPoint) {
            draggingPoint = cursorInEndPoint(loc);
        }
    }
};

canvas.onmousemove = function (e) {
    var loc = windowToCanvas(e.clientX, e.clientY);

    if ( dragging || draggingPoint) {
        e.preventDefault();
        restoreDrawingSurface();

        if(guidewires) {
            drawGuideWires(loc.x, loc.y);
        }
    }

    if (dragging) {
        update.Rubberband(loc);
        drawControlAndEndPoints();
    } else if (draggingPoint) {
        updateDraggingPoint(loc);
        drawControlAndEndPoints();
        drawBezierCurve();
    }
};

canvas.onmouseup = function (e) {
    loc = windowToCanvas(e.clientX, e.clientY);

    restoreDrawingSurface();

    if (!editing) {
        updateRubberband(loc);
        drawControlAndEndPoints();
        dragging = false;
        editing = true;
        if (showInstructions) {
            instructions.style.display = 'inline';
        }
    } else {
        if (draggingPoint) {
            drawControlAndEndPoints();
        } else {
            editing = false;
            drawBezierCurve();
            draggingPoint = undefined;
        }
    }
};

// Control event handlers

eraseAllButton.onclick = function (e) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(GRID_STROKE_STYLE, GRID_SPACING, GRID_SPACING);

    saveDrawingSurface();

    editing = false;
    dragging = false;
    draggingPoint = undefined;
};

strokeStyleSelect.onchange = function (e) {
    context.strokeStyle = strokeStyleSelect.value;
};

guidewireCheckbox.onchange = function (e) {
    guidewires = guidewireCheckbox.checked;
};

// Instructions event handlers

instructionsOkayButton.onclick = function (e) {
    instructions.style.display = 'none';
};

instructionsNoMoreButton.onclick = function (e) {
    instructions.style.display = 'none';
    showInstructions = false;
};

// Init

context.strokeStyle = strokeStyleSelect.value;
drawGrid(GRID_STROKE_STYLE, GRID_SPACING, GRID_SPACING);
