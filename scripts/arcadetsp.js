var minPoints = 5;
var pointSize = 10;
var points = [];
var solution = [];
var optimisedSolution = [];
var mode = 'build';

var blue = '#1481ba';
var pink = '#f9b9f2';
var yellow  = '#ffa400';
var white  = '#ffffff';

var solving = false;

var difficulty = "medium";

function distance(point1, point2) {
  if (point1 == undefined || point2 == undefined) {
    return 0;
  }
  return Math.sqrt(
    Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

function play(soundName) {
  new Audio("fx/" + soundName.toLowerCase() + ".wav").play();
}

function costOf(solution) {
  var cost = 0;
  var start = points[solution[0]];
  var previous = start;

  for (w = 1; w < solution.length; w++) {
    var point = points[solution[w]];
    cost += distance(point, previous);
    previous = point;
  }

  if (solution.length == points.length) {
    cost += distance(previous, start);
  }

  return Math.round(cost);
}

function indexOf(point, points) {
  for (p in points) {
    var existingPoint = points[p]
    if (Math.abs(existingPoint.x - point.x) <= pointSize &&
        Math.abs(existingPoint.y - point.y) <= pointSize) {
        return p;
    }
  }
  return -1;
}

function addPoint(point) {
  if (indexOf(point, points) < 0) {
    points.push(point);
    play("addPoint");
  }
}

function removePoint(point) {
  var index = indexOf(point, points);
  while (index >= 0) {
    points.splice(index, 1);
    play("removePoint");
    index = indexOf(point, points);
  }
}

function addWaypoint(point) {
  var index = indexOf(point, points);
  if (index >= 0) {
    if (solution.indexOf(index) < 0) {
      solution.push(index);
      play("addWaypoint");
    }
  }
}

function removeWaypoint(point) {
  var index = indexOf(point, points);
  if (index >= 0) {
    index = solution.indexOf(index);
    if (index >= 0) {
      solution.splice(index, 1);
      play("removeWaypoint");
    }
  }
}

function isRightClick(event) {
  if ('which' in event) {
    return event.which == 3;
  } else if ('button' in e) {
    return event.button == 2;
  }
  return false;
}

function getPosition(canvas, event) {
  var rect = canvas.getBoundingClientRect();
  var x = event.clientX - rect.left;
  var y = event.clientY - rect.top;
  return {
    x: Math.round(x),
    y: Math.round(y)
  };
}

function clearCanvas(canvas) {
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function printTour(ctx, solution, color, dashed) {
  if (dashed) {
    ctx.setLineDash([4, 2]);
  } else {
    ctx.setLineDash([]);
  }
  ctx.strokeStyle = color;
  if (solution.length > 1) {
    ctx.beginPath();
    var start = points[solution[0]];
    var previous = start;
    ctx.moveTo(previous.x, previous.y);
    for (w = 1; w < solution.length; w++) {
      var point = points[solution[w]];
      ctx.lineTo(point.x, point.y);
      previous = point;
    }
    if (solution.length == points.length) {
      ctx.lineTo(start.x, start.y);
    }
    ctx.stroke();
  }
}

function printPoints(ctx, points, colorSelected, colorDeselected, colorLast) {
  for (p in points) {
    var point = points[p];
    var indexInSolution = solution.indexOf(indexOf(point, points));
    if (indexInSolution >= 0) {
      if (indexInSolution == solution.length-1 && solution.length < points.length) {
        ctx.fillStyle = colorLast;
      } else {
        ctx.fillStyle = colorSelected;
      }
    } else {
      ctx.fillStyle = colorDeselected;
    }
    ctx.fillRect(
      point.x-pointSize / 2,
      point.y-pointSize / 2,
      pointSize,
      pointSize
    );
  }
}

function redrawCanvas(canvas) {
  clearCanvas(canvas);
  if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    if (mode == 'solve') {
      printTour(ctx, solution, pink, true);
    } else {
      printTour(ctx, solution, pink, false);
    }
    printTour(ctx, optimisedSolution, yellow, false);
    printPoints(ctx, points, pink, blue, yellow);
    document.getElementById('cost').textContent = costOf(solution);
    document.getElementById('cpu_cost').textContent = costOf(optimisedSolution);
  }
  document.getElementById('message').innerHTML = message;
  updateButtons();
}

function updateButtons() {
  $('#clearButton').addClass('disabled');
  $('#playButton').addClass('disabled');
  $('#solveButton').addClass('disabled');

  if (points.length > 0) {
      $('#clearButton').removeClass('disabled');
  }
  if (points.length >= minPoints) {
    $('#playButton').removeClass('disabled');
  }
  if (solution.length > 0 && solution.length == points.length && message != "Thinking ...") {
    $('#solveButton').removeClass('disabled');
  }
}

function setMode(newMode) {
  mode = newMode;
   if (newMode == 'play') {
     solution = [];
     optimisedSolution = [];
     message = "<p>Left-click on the points in turn to create a path (right-click to remove a point from the path).</p><p>Then press <span class='yellow'>[ CHECK ]</span> to see if you can do better than our robotic overlords.</p>";
   } else if (newMode == 'build') {
     points = [];
     solution = [];
     optimisedSolution = [];
     message = "<p>Build a problem by left-clicking on the screen to add <span class='red'>at least 5</span> points (right-click to remove a point).</p><p>Then press <span class='yellow'>[ PLAY ]</span> to challenge someone to find the shortest path connecting the points.</p>";
    } else if (newMode == 'solve') {

     solve();
   }

   var canvas = $('#board').get(0);
   redrawCanvas(canvas);
}

function redAlert(notice) {

  play("lose");
  previousMessage = message

  message = "<p class='red blink center'>" + notice  + "</p>";
  var canvas = $('#board').get(0);
  redrawCanvas(canvas);


  setTimeout(function() {
    message = previousMessage;
    redrawCanvas(canvas);
  }, 3000);


}


var setUpGame = function() {

  // set up canvas event listeners
  var leftClickEventHandler = function(event) {
    var canvas = $('#board').get(0);
    if (mode == 'build') {
        addPoint(getPosition(canvas, event));
    } else if (mode == 'play') {
        addWaypoint(getPosition(canvas, event));
    } else if (mode == 'solve') {

    }
    redrawCanvas(canvas);
 };

 // set up canvas event listeners
 var rightClickEventHandler = function(event) {
    event.preventDefault();
    var canvas = $('#board').get(0);
    if (mode == 'build') {
        removePoint(getPosition(canvas, event));
    } else if (mode == 'play') {
        removeWaypoint(getPosition(canvas, event));
    }
    redrawCanvas(canvas);
 };

 // board listeners
  $('#board').click(leftClickEventHandler);
  $('#board').contextmenu(rightClickEventHandler);

  // clear
  $('#clearButton').on('click', function(event) {
    setMode('build');
  });

  // play
  $('#playButton').on('click', function(event) {

    if (mode == 'solve' && solving) {
      redAlert("You can't play while the solver is doing its thing!");
    } else if (mode == 'build' && points.length < minPoints) {
      redAlert('Define at least ' + minPoints + ' points.');
    } else {
      setMode('play');
    }
  });

  // hard mode
  $('#hardButton').on('click', function(event) {
    difficulty = "hard";
  });

  // easy mode
  $('#easyButton').on('click', function(event) {
    difficulty = "easy";
  });

  // medium mode
  $('#mediumButton').on('click', function(event) {
    difficulty = "medium";
  });


  // solve
  $('#solveButton').on('click', function(event) {
    if (solution.length < points.length) {
      setMode('play');
      redAlert('Build a full solution first!');
    } else {
      if (message != "Thinking ...") {
        setMode('solve');
      }
    }
  });

  setMode("build");
 
  // var soundtrack = new Audio("fx/ost.wav");
  // soundtrack.loop = true;
  // soundtrack.play();

  // Starfield
  var container = document.getElementById('starfield');
  var starfield = new Starfield();
  starfield.initialise(container);
  starfield.start();

  function randomise() {
    starfield.stop();
    starfield.stars = Math.random()*1000 + 50;
    starfield.minVelocity = Math.random()*30+5;
    starfield.maxVelocity = Math.random()*50 + starfield.minVelocity;
    starfield.start();
  }
};

function newBest(solution) {
  optimisedSolution = solution.slice();
  play("newOptimisedSolution");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function nearestNeighbour(current) {
  current.length = 0;
  current.push(Math.floor(Math.random() * points.length));
  while (current.length < points.length) {
    var closest = 0
    var minDistance = Infinity
    for (i = 0; i < points.length; i++) {
      if (current.includes(i)) {
        continue;
      }
      var currentDistance = distance(points[i], points[current[current.length-1]]);
      if (currentDistance < minDistance) {
        closest = i;
      }
    }
    current.push(closest);
  }
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function performRandomSwap(current) {
  // perform random swap
  var i = Math.floor(Math.random() * current.length);
  var j = i +  Math.floor(Math.random() * current.length - i);

  var s = current[i];
  current[i] = current[j];
  current[j] = s;
}

function performRandomRelocate(current) {
  // perform random relocate
  var i = undefined, j = undefined;
  while (i == j) {
    var i = Math.floor(Math.random() * current.length);
    var j = Math.floor(Math.random() * current.length);
  }

  var s = current[i];
  current.splice(i,1);
  current.splice(j, 0, s)
}

async function solve() {

  var canvas = $('#board').get(0);

  message = "Thinking ...";

  var current = solution.slice();

  if (difficulty == "easy") {
    shuffle(current);
  } else if (difficulty == "medium") {
    nearestNeighbour(current);
  }

  newBest(current);
  redrawCanvas(canvas);

  var bestCost = costOf(current);
  var currentCost = bestCost;
  var temperature = 1000000;
  var coolingRate = 0.999;

  var iterations = 0;

  while (temperature >= 1e-5) {

    iterations++;

    temperature *= coolingRate;

    var original = current.slice();

    if (Math.random() < 0.5) {
      performRandomSwap(current);
    } else {
      performRandomRelocate(current);
    }

    var newCost = costOf(current);
    var delta = newCost - currentCost;
    var probability = Math.exp(-delta/temperature);

    if (newCost <= currentCost) {
      currentCost = newCost;
    } else if (Math.random() < probability) {
        currentCost = newCost;
    } else {
      current = original;
    }

    if (currentCost < bestCost) {
      newBest(current);
      await sleep(50);
      bestCost = currentCost;
      redrawCanvas(canvas);
    }

  }

  if (costOf(optimisedSolution) < costOf(solution)) {
    message = "<p class='center'>Synthetic wins!<img class='win' src='gfx/robot.gif' /></p> ";
    play('lose');
  } else {
    message = "<p class='center'>Organic wins! <img class='win' src='gfx/hooman.gif' /></p>";
    play("win");
  }
  redrawCanvas(canvas);
}

$('body').ready(setUpGame);
