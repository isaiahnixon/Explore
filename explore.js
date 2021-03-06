// Global event listener
document.addEventListener('DOMContentLoaded', onLoad);

// Object variables
let player_1;
let opponent;
let statuses;

// Global variables
let intro;
let outro;
let map;
let difficulty;
let last_touch;
let player_1_pos = { x:0, y:0 };
let mouse = { x:0, y:0 };
let player_1_offset;
let player_1_size;
let map_width;
let map_height;
let vibrating = 0;

// Interval variables
let mouseInterval;
let counterInterval;

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
    const midX = window.pageXOffset + (window.innerWidth / 2);
    const midY = window.pageYOffset + (window.innerHeight / 2);
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
    let map_array = []

    // Meta data.
    map_array['size'] = size;

    // Fill the array.
    for (let i = 0; i < size; i++) {
        map_array[i] = [];

        for (let f = 0; f < size; f++) {
            const rand = Math.random();
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
    const map_size = 1000;
    const grid_size = 1000 / map_array['size'];


    map.style.height = map_size + 'vw';
    map.style.width = map_size + 'vw';

    // Render the map
    for (let i = 0; i < map_array.length; i++) {
        for (let j = 0; j < map_array[i].length; j++) {
            const object = map_array[i][j];
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
        const touch = e.touches[0] || e.changedTouches[0];
        mouse.x = touch.pageX;
        mouse.y = touch.pageY - 64;
    } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover'|| e.type=='mouseout' || e.type=='mouseenter' || e.type=='mouseleave') {
        mouse.x = e.pageX;
        mouse.y = e.pageY;
    }
}

// Updates the position of player_1 based upon the global mouse variable
function followMouse() {
    let divisor;
    const collision = collisionCheck();

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

    const midX = window.pageXOffset + (window.innerWidth / 2);
    const midY = window.pageYOffset + (window.innerHeight / 2);

    const scrollDistX = (mouse.x - midX) / divisor;
    const scrollDistY = (mouse.y - midY) / divisor;

    const playerDistX = mouse.x - player_1_pos.x;
    const playerDistY = mouse.y - player_1_pos.y;

    const scrollMinTop = 0;
    const scrollMinLeft = 0;
    const scrollMaxLeft = map_width - window.innerWidth;
    const scrollMaxTop = map_height - window.innerHeight;
    const scrollNewTop = document.documentElement.scrollTop + scrollDistY;
    const scrollNewLeft = document.documentElement.scrollLeft + scrollDistX;

    if (scrollNewTop > scrollMinTop  && scrollNewTop < scrollMaxTop) {
        mouse.y += scrollDistY;
        document.documentElement.scrollTop = scrollNewTop;
    }
    if (scrollNewLeft > scrollMinLeft && scrollNewLeft < scrollMaxLeft) {
        mouse.x += scrollDistX;
        document.documentElement.scrollLeft = scrollNewLeft;
    }

    const playerMinTop = player_1_offset;
    const playerMinLeft = player_1_offset;
    const playerMaxLeft = map_width - player_1_offset * 2;
    const playerMaxTop = map_height - player_1_offset * 2;
    const playerNewTop = player_1_pos.y + (playerDistY / divisor);
    const playerNewLeft = player_1_pos.x + (playerDistX / divisor);

    let direction = 'forward';

    if (Math.abs(playerDistY) < Math.abs(playerDistX)) {
        // This is flipped on purpose.
        // The player object is "facing" the opposite direction of the user.
        // All directions are based on the player's position, not the user's.
        if (Math.abs(playerDistX) > player_1.getBoundingClientRect().width) {
            if (mouse.x < player_1_pos.x) {
                direction = 'right';
            } else {
                direction = 'left';
            }
        }
    } else {
        if (mouse.y < player_1_pos.y && Math.abs(playerDistY) > player_1.getBoundingClientRect().height) {
            direction = 'backward';
        }
    }

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
    player_1.setAttribute('direction', direction);

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
    const objectives = document.getElementsByTagName('objective');

    for (let i = objectives.length - 1; i >= 0; i--) {
        if (RectRectColliding(player_1, objectives[i])) {
            return 'objective';
        }
    }

    // Check collision with opponents.
    const opponents = document.getElementsByTagName('opponent');

    for (let i = opponents.length - 1; i >= 0; i--) {
        if (RectCircleColliding(player_1, opponents[i])) {
            return 'opponent';
        }
    }

    // Check collision with obstacles.
    const obstacles = document.getElementsByTagName('obstacle');

    for (let i = obstacles.length - 1; i >= 0; i--) {
        if (RectRectColliding(player_1, obstacles[i])) {
            return 'obstacle';
        }
    }

    return '';
}

// Generates a new element with the given specifications
function create(element, left, top, size) {
    let obstacle = document.createElement(element);
    obstacle.style.width = size;
    obstacle.style.height = size;
    obstacle.style.left = left;
    obstacle.style.top = top;
    map.appendChild(obstacle);
}

// Deletes all of the specified element
function clear(tagName) {
    const objects = document.getElementsByTagName(tagName);
    for (let i = objects.length - 1; i >= 0; i--) {
        map.removeChild(objects[i]);
    }
}

// Checks for collision between two rectangles, giving 3px of padding
// Based on: https://stackoverflow.com/a/35974082/9637665
function RectRectColliding(a, b) {
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();

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
    const circle = c.getBoundingClientRect();
    const rect = r.getBoundingClientRect();

    circle.radius = (circle.width / 2) - 3;
    circle.x = circle.left + circle.radius;
    circle.y = circle.top + circle.radius;

    const distX = Math.abs(circle.x - rect.left-rect.width/2);
    const distY = Math.abs(circle.y - rect.top-rect.height/2);

    if (distX > (rect.width/2 + circle.radius)) { return false; }
    if (distY > (rect.height/2 + circle.radius)) { return false; }

    if (distX <= (rect.width/2)) { return true; } 
    if (distY <= (rect.height/2)) { return true; }

    const dx=distX-rect.width/2;
    const dy=distY-rect.height/2;
    return (dx*dx+dy*dy<=(circle.radius*circle.radius));
}

// https://stackoverflow.com/a/48287386.
function printArr(arr) {
let str = "";
  for (const item of arr) {
    if (Array.isArray(item)) str += printArr(item) + '\n';
    else str += item + ", ";
  }
  return str;
}

// Sets the textContent of all objects to a value
function set(object, value) {
    let objects = document.getElementsByTagName(object);

    for (let i = objects.length - 1; i >= 0; i--) {
        objects[i].textContent = value;
    }
}

// Counts down and then deletes the counter
function countUp() {
    let counters = document.getElementsByTagName('COUNTER');

    for (let i = counters.length - 1; i >= 0; i--) {
        counters[i].textContent = parseInt(counters[i].textContent) + 1;
    }
}