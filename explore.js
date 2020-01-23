// Global event listener
document.addEventListener('DOMContentLoaded', onLoad);

// Object variables
var player_1;
var opponent;
var statuses;

// Global variables
var intro;
var outro;
var map;
var difficulty;
var last_touch;
var player_1_pos = { x:0, y:0 };
var mouse = { x:0, y:0 };
var player_1_offset;
var player_1_size;
var map_width;
var map_height;
var vibrating = 0;

// Interval variables
var mouseInterval;
var counterInterval;

// Handles the initial game load
function onLoad() {
    // Define the main elements
    player_1 = document.getElementsByTagName('PLAYER')[0];
    map = document.getElementsByTagName('MAP')[0];
    intro = document.getElementsByTagName('INTRO')[0];
    outro = document.getElementsByTagName('OUTRO')[0];

    // Display the intro
    intro.style.visibility = 'visible';
    map.style.visibility = 'hidden';
    outro.style.visibility = 'hidden';
}

// Handles the start of the game
function onStart() {
    // Create the map
    map_array = createMapArray(30, 30);
    renderMap(map_array);

    // Update global variables
    player_1_offset = player_1.offsetWidth / 2;
    map_height = Math.max( 
        document.body.scrollHeight,
        document.body.offsetHeight, 
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
    );
    map_width = Math.max( 
        document.body.scrollWidth,
        document.body.offsetWidth, 
        document.documentElement.clientWidth,
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth
    );

    // Display the map
    intro.style.visibility = 'hidden';
    outro.style.visibility = 'hidden';
    map.style.visibility = 'visible';

    // Request fullscreen
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
        document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
        document.documentElement.msRequestFullscreen();
    }
    
    
    // Update positions
    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = 0;
    var midX = window.pageXOffset + (window.innerWidth / 2);
    var midY = window.pageYOffset + (window.innerHeight / 2);
    player_1_pos.x = midX;
    player_1_pos.y = midY;
    mouse.x = midX;
    mouse.y = midY;
    player_1.style.left = player_1_pos.x + 'px';
    player_1.style.top = player_1_pos.y + 'px';

    // Set the counters to 0;
    set('counter', 0);

    // Event listeners
    [
        'touchstart',
        'touchmove',
        'touchend',
        'touchcancel',
        'mousedown',
        'mouseup',
        'mousemove',
        'mouseover',
        'mouseout',
        'mouseenter',
        'mouseleave',
    ].forEach( evt => 
        document.addEventListener(evt, getMouse)
    );

    // Intervals
    mouseInterval = setInterval(followMouse, 32);
    counterInterval = setInterval(countUp, 1000);
}

// Handles the end of the game
function onEnd(status) {
    // Display the outro
    intro.style.visibility = 'hidden';
    map.style.visibility = 'hidden';
    outro.style.visibility = 'visible';
    
    // Clear the intervals
    clearInterval(mouseInterval);
    clearInterval(counterInterval);
    
    // Clear the event listeners
    [
        'touchstart',
        'touchmove',
        'touchend',
        'touchcancel',
        'mousedown',
        'mouseup',
        'mousemove',
        'mouseover',
        'mouseout',
        'mouseenter',
        'mouseleave',
    ].forEach( evt => 
        document.removeEventListener(evt, getMouse)
    );
    
    // Clear the obstacles and projectiles
    clear('obstacle');
    clear('opponent');

    // Set the statues.
    set('status', status);
}

// Create the map
function createMapArray(size) {
    // Initialize the array
    var map_array = []

    // Meta data.
    map_array['size'] = size;

    // Fill the array.
    for (var i = 0; i < size; i++) {
        map_array[i] = [];

        for (var f = 0; f < size; f++) {
            var rand = Math.random();
            if (rand > 0.95) {
                map_array[i].push("O");
            } else if (rand > 0.65) {
                map_array[i].push("X");
            } else {
                map_array[i].push("0");
            }
        }
    }

    // Clear the upper left of the map.
    map_array[0][0] = '0';
    map_array[0][1] = '0';
    map_array[0][2] = '0';
    map_array[1][0] = '0';
    map_array[1][1] = '0';
    map_array[1][2] = '0';
    map_array[2][0] = '0';
    map_array[2][1] = '0';
    map_array[2][2] = '0';

    // Place the objective in the lower right hand corner.
    map_array[size - 1][size - 1] = "$";

    return map_array;
}

// Turn the map into objects
function renderMap(map_array) {
    // Size the map
    var map_size = 1000;
    var grid_size = 1000 / map_array['size'];


    map.style.height = map_size + 'vw';
    map.style.width = map_size + 'vw';

    // Render the map
    for (var i = 0; i < map_array.length; i++) {
        for (var j = 0; j < map_array[i].length; j++) {
            var object = map_array[i][j];
            if (object == "X") {
                create('obstacle', j * grid_size + 'vw', i * grid_size + 'vw', grid_size + 'vw');
            } else if (object == "O") {
                create('opponent', j * grid_size + 'vw', i * grid_size + 'vw', grid_size + 'vw');
            } else if (object == "$") {
                create('objective', j * grid_size + 'vw', i * grid_size + 'vw', grid_size + 'vw')
            }
        }
    }
}

// Updates global mouse variable based upon event attributes
function getMouse(e) {
    if(e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel'){
        var touch = e.touches[0] || e.changedTouches[0];
        mouse.x = touch.pageX;
        mouse.y = touch.pageY - 64;
    } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover'|| e.type=='mouseout' || e.type=='mouseenter' || e.type=='mouseleave') {
        mouse.x = e.pageX;
        mouse.y = e.pageY;
    }
}

// Updates the position of player_1 based upon the global mouse variable
function followMouse() {
    var divisor;
    var collision = collisionCheck();

    switch (collision) {
        case 'objective':
            onEnd('won');
            return;
            break;
        case 'opponent':
            onEnd('died');
            return;
            break;
        case 'obstacle':
            divisor = 70;
            vibrate();
            break;
        default:
            divisor = 10
    }

    var midX = window.pageXOffset + (window.innerWidth / 2);
    var midY = window.pageYOffset + (window.innerHeight / 2);

    var scrollDistX = (mouse.x - midX) / divisor;
    var scrollDistY = (mouse.y - midY) / divisor;

    var playerDistX = (mouse.x - player_1_pos.x) / divisor;
    var playerDistY = (mouse.y - player_1_pos.y) / divisor;

    var scrollMinTop = 0;
    var scrollMinLeft = 0;
    var scrollMaxLeft = map_width - window.innerWidth;
    var scrollMaxTop = map_height - window.innerHeight;
    var scrollNewTop = document.documentElement.scrollTop + scrollDistY;
    var scrollNewLeft = document.documentElement.scrollLeft + scrollDistX;

    if (scrollNewTop > scrollMinTop  && scrollNewTop < scrollMaxTop) {
        mouse.y += scrollDistY;
        document.documentElement.scrollTop = scrollNewTop;
    }
    if (scrollNewLeft > scrollMinLeft && scrollNewLeft < scrollMaxLeft) {
        mouse.x += scrollDistX;
        document.documentElement.scrollLeft = scrollNewLeft;
    }

    var playerMinTop = player_1_offset;
    var playerMinLeft = player_1_offset;
    var playerMaxLeft = map_width - player_1_offset * 2;
    var playerMaxTop = map_height - player_1_offset * 2;
    var playerNewTop = player_1_pos.y + playerDistY;
    var playerNewLeft = player_1_pos.x + playerDistX;

    if (playerNewTop <= playerMinTop) {
        player_1_pos.y = playerMinTop;
    } else if (playerNewTop >= playerMaxTop) {
        player_1_pos.y = playerMaxTop;
    } else {
        player_1_pos.y = playerNewTop;
    }

    if (playerNewLeft <= playerMinLeft) {
        player_1_pos.x = playerMinLeft;
    } else if (playerNewLeft >= playerMaxLeft) {
        player_1_pos.x = playerMaxLeft;
    } else {
        player_1_pos.x = playerNewLeft;
    }

    player_1.style.top = player_1_pos.y - player_1_offset + 'px';
    player_1.style.left = player_1_pos.x - player_1_offset + 'px';
}

// Vibrate the device (if available at a steady pulse)
function vibrate() {
    // If not already vibrating, vibrate for 200ms.
    if (vibrating == 0) {
        window.navigator.vibrate(100, 30, 250);
        vibrating = 1;
        setTimeout( function() {
            vibrating = 0;
        }, 600);
    }
    
}

// A function to see what player_1 is currently colliding with.
function collisionCheck() {
    var objectives = document.getElementsByTagName('objective');

    for (var i = objectives.length - 1; i >= 0; i--) {
        if (RectRectColliding(player_1, objectives[i])) {
            return 'objective';
        }
    }

    // Check collision with opponents.
    var opponents = document.getElementsByTagName('opponent');

    for (var i = opponents.length - 1; i >= 0; i--) {
        if (RectCircleColliding(player_1, opponents[i])) {
            return 'opponent';
        }
    }

    // Check collision with obstacles.
    var obstacles = document.getElementsByTagName('obstacle');

    for (var i = obstacles.length - 1; i >= 0; i--) {
        if (RectRectColliding(player_1, obstacles[i])) {
            return 'obstacle';
        }
    }

    return '';
}

// Generates a new element with the given specifications
function create(element, left, top, size) {
    var obstacle = document.createElement(element);
    obstacle.style.width = size;
    obstacle.style.height = size;
    obstacle.style.left = left;
    obstacle.style.top = top;
    map.appendChild(obstacle);
}

// Deletes all of the specified element
function clear(tagName) {
    var objects = document.getElementsByTagName(tagName);
    for (var i = objects.length - 1; i >= 0; i--) {
        map.removeChild(objects[i]);
    }
}

// Checks for collision between two rectangles, giving 3px of padding
// Based on: https://stackoverflow.com/a/35974082/9637665
function RectRectColliding(a, b) {
    var aRect = a.getBoundingClientRect();
    var bRect = b.getBoundingClientRect();

    aRect.height -= 3;
    aRect.width -= 3;

    return !(
        ((aRect.top + aRect.height) < (bRect.top)) ||
        (aRect.top > (bRect.top + bRect.height)) ||
        ((aRect.left + aRect.width) < bRect.left) ||
        (aRect.left > (bRect.left + bRect.width))
    );
}

// Checks for collision between a circle and a rectangle.
// https://stackoverflow.com/a/21096179/9637665
function RectCircleColliding(r,c){
    var circle = c.getBoundingClientRect();
    var rect = r.getBoundingClientRect();

    circle.radius = (circle.width / 2) - 3;
    circle.x = circle.left + circle.radius;
    circle.y = circle.top + circle.radius;

    var distX = Math.abs(circle.x - rect.left-rect.width/2);
    var distY = Math.abs(circle.y - rect.top-rect.height/2);

    if (distX > (rect.width/2 + circle.radius)) { return false; }
    if (distY > (rect.height/2 + circle.radius)) { return false; }

    if (distX <= (rect.width/2)) { return true; } 
    if (distY <= (rect.height/2)) { return true; }

    var dx=distX-rect.width/2;
    var dy=distY-rect.height/2;
    return (dx*dx+dy*dy<=(circle.radius*circle.radius));
}

// https://stackoverflow.com/a/48287386.
function printArr(arr) {
let str = "";
  for (let item of arr) {
    if (Array.isArray(item)) str += printArr(item) + '\n';
    else str += item + ", ";
  }
  return str;
}

// Sets the textContent of all objects to a value
function set(object, value) {
    var objects = document.getElementsByTagName(object);

    for (var i = objects.length - 1; i >= 0; i--) {
        objects[i].textContent = value;
    }
}

// Counts down and then deletes the counter
function countUp() {
    var counters = document.getElementsByTagName('COUNTER');

    for (var i = counters.length - 1; i >= 0; i--) {
        counters[i].textContent = parseInt(counters[i].textContent) + 1;
    }
}