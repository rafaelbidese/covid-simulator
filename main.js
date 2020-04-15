// Declare as variable
var canvas;
var context;
var dpi;
var rectX = 0;
var rectY = 0;
var circleRadius = 10;
let oldTimeStamp = 0;
let controlIsTheEnd = false;
var population = [];
var elapsedTime;

// control variables
let randomizePositions = false;
let totalPopulation = 75;
let infectedProportion = 0.05;
let robotProportion = 0.10;
let peopleSpeedInteraction = 20;
let chanceOfContamination = 0.3;
let chanceOfContaminationRobot = 0.1;
let incubationTime = 5;
let sickTime = 10;
let chanceOfDeath = 0.2;

let status = {
  healthy: "healthy",
  infected: "infected",
  sick: "sick",
  healed: "healed",
  dead: "dead",
}

let healthColors = {
  healthy : "#0099b0",
  infected : "#dbdb27",
  sick : "#ff8080",
  healed : "#0051d9",
  dead : "#333333"
}


// Listen to the onLoad event
window.onload = init;


function configureSliders(){
  var slider = document.getElementById("selPop");
  var output = document.getElementById("textPop");
  output.innerHTML = slider.value; // Display the default slider value
// Update the current slider value (each time you drag the slider handle)
  slider.oninput = function() {
    output.innerHTML = this.value;
  }

  var sliderInfect = document.getElementById("selInfect");
  var outputInfect = document.getElementById("textInfect");
  outputInfect.innerHTML = sliderInfect.value; // Display the default slider value
// Update the current slider value (each time you drag the slider handle)
  sliderInfect.oninput = function() {
    outputInfect.innerHTML = this.value;
  }

  var sliderDeath = document.getElementById("selDeath");
  var outputDeath = document.getElementById("textDeath");
  outputDeath.innerHTML = sliderDeath.value; // Display the default slider value
// Update the current slider value (each time you drag the slider handle)
  sliderDeath.oninput = function() {
    outputDeath.innerHTML = this.value;
  }
  
}

function coinToss(){
  return (Math.floor(Math.random() * 2) == 0) ? true : false;
}

function proportion(percent){
  return (Math.floor(Math.random() * 100) < percent * 100 ) ? true : false;
}

function fixDpi(){
  dpi = window.devicePixelRatio;
  var style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
  var style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
  canvas.setAttribute('height', style_height * dpi);
  canvas.setAttribute('width', style_width * dpi);
}

// Trigger init function when the page has loaded
function init() {
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    fixDpi()
    configureSliders();
    elapsedTime = document.getElementById("time");

    setupGraph();
    createWorld(randomizePositions, infectedProportion, robotProportion);

    window.requestAnimationFrame(gameLoop);
}


class PersonObject
{
    constructor (context, health, hasRobot, x, y, vx, vy){
        this.context = context;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.health = health;
        this.timeGotInfected = 0;
        this.timeGotSick = 0;
        this.hasRobot = hasRobot;
    }
}

class Person extends PersonObject
{
    constructor (context, health, hasRobot, x, y, vx, vy){
        super(context, health, hasRobot, x, y, vx, vy);
        this.radius = circleRadius;
    }

    gotInfected(timeStamp){
      this.health = status.infected;
      this.timeGotInfected = timeStamp;
    }

    gotSick(timeStamp){
      this.health = status.sick;
      this.timeGotSick = timeStamp;
    }
    isSick(){
      return this.health == status.sick;
    }
    isInfected(){
      return this.health == status.infected;
    }
    isHealthy(){
      return this.health == status.healthy;
    }
    isAlive(){
      return this.health != status.dead;
    }
    isDead(){
      return this.health == status.dead;
    }
    isHealed(){
      return this.health == status.healed;
    }
    canTransmit(){
      return this.isInfected() || this.isSick()
    }
    died(){
      this.health = status.dead;
      this.vx=0;
      this.vy=0;
    }
    healed(){
      this.health = status.healed;
    }

    liveOrDie(lucky){
      lucky ? this.healed() : this.died();
    }

    draw(){
        //Draw a simple square
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        this.context.fillStyle = healthColors[this.health];
        this.context.fill();
        if(this.hasRobot){
          this.context.lineWidth = "5"
          this.context.strokeStyle = "gray";
          this.context.stroke();
        }
    }

    update(secondsPassed){
        //Move with set velocity
        this.x += this.vx * secondsPassed;
        this.y += this.vy * secondsPassed;
    }
    
}

function createWorld(random, infectedPercent, robotPercent){
  var xincr = Math.floor(canvas.width/Math.sqrt(totalPopulation));
  var yincr = Math.floor(canvas.height/Math.sqrt(totalPopulation));
  var x = 0;
  var y = 0;
  for(var i = 0 ; i < totalPopulation; i++){
    var xvdir = coinToss() ? -1 : 1;
    var yvdir = coinToss() ? -1 : 1;
    var isInfected = proportion(infectedPercent) ? status.infected : status.healthy;
    var hasRobot = ((isInfected == status.healthy)  && proportion(robotPercent)) ? true : false;
    if(random){
      population.push(new Person(
        context,
        isInfected,
        hasRobot,
        canvas.width * Math.random() + circleRadius,
        canvas.height * Math.random() + circleRadius,
        xvdir * (Math.random() * peopleSpeedInteraction / 10 + peopleSpeedInteraction),
        yvdir * (Math.random() * peopleSpeedInteraction / 10 + peopleSpeedInteraction)
      ));    
    }
    else
    {
      if(x > canvas.width){
        y += yincr;
        x = 0;
      }
      population.push(new Person(
        context,
        isInfected,
        hasRobot,
        x + 10 * Math.random(),
        y + 10 * Math.random(),
        xvdir * (Math.random() * peopleSpeedInteraction / 10 + peopleSpeedInteraction),
        yvdir * (Math.random() * peopleSpeedInteraction / 10 + peopleSpeedInteraction)
        ));    
      x += xincr;
    }
  }
}

function handleBorders(person){
  if(person.x > canvas.width || person.x < 0){
    person.vx = -person.vx;
  } 
  if(person.y > canvas.height || person.y < 0 ){
    person.vy = -person.vy;
  }
}

function handleCollision(person1, person2){
  if(person1.isAlive() && person2.isAlive()){
    if (circleIntersect(person1.x, person1.y, person1.radius, person2.x, person2.y, person2.radius)){
      person1.vx = -person1.vx;
      person1.vy = -person1.vy;
      person2.vx = -person2.vx;
      person2.vy = -person2.vy;
      handleTransmission(person1,person2);
  } 
}
}

function handleTransmission(person1, person2){
  chance = (person1.hasRobot || person1.hasRobot) ? chanceOfContaminationRobot : chanceOfContamination;
  if(person1.isHealthy() && person2.canTransmit()){
    if(proportion(chance)){person1.gotInfected(oldTimeStamp);}
  } 
  if(person2.isHealthy() && person1.canTransmit()){
    if(proportion(chance)){person2.gotInfected(oldTimeStamp);}
  }  
}

function handleProgression(person){
  if(person.isHealthy()){
    return;
  }

  if(person.isInfected()){
    if((oldTimeStamp - person.timeGotInfected) > (incubationTime + Math.random() * 10) * 1000){
      person.gotSick(oldTimeStamp);
      return;
    }
  }
  if(person.isSick()){
    if((oldTimeStamp - person.timeGotSick) > (sickTime + Math.random() * 15) * 1000){
      person.liveOrDie(proportion(1-chanceOfDeath));
      return;
    }
  }
}

function loopThroughPeople(){
  var person1;
  var person2;

  // Start checking for collisions
  for (var i = 0; i < population.length; i++)
  {
      person1 = population[i];
      handleBorders(person1);
      handleProgression(person1);
      for (var j = i + 1; j < population.length; j++)
      {
        person2 = population[j];
        handleCollision(person1,person2);
      }
    }
}


function clearCanvas() {
  // Clear the canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function circleIntersect(x1, y1, r1, x2, y2, r2) {

  // Calculate the distance between the two circles
  var squareDistance = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);

  // When the distance is smaller or equal to the sum
  // of the two radius, the circles touch or overlap
  return squareDistance <= ((r1 + r2) * (r1 + r2))
}

function setupGraph(){
  data = getData(true);
  var layout = {
    xaxis: {
      range: [0, 300],
      autorange: true
    },
    yaxis: {
      range: [0, 300],
      autorange: true
    },
    legend: {
      y: 0.5,
      traceorder: 'reversed',
      font: {
        size: 16
      }
    }
  };
  var config = {responsive: true}
  Plotly.plot('graph1', data, layout, config);
}

function getHealthyCount(){
  var count = 0;
  population.forEach((person) => (person.isHealthy() && count++));
  return count;
}

function getInfectedCount(){
  var count = 0;
  population.forEach((person) => (person.isInfected() && count++));
  return count;
}
function getSickCount(){
  var count = 0;
  population.forEach((person) => (person.isSick() && count++));
  return count;
}

function getHealedCount(){
  var count = 0;
  population.forEach((person) => (person.isHealed() && count++));
  return count;
}

function getDeadCount(){
  var count = 0;
  population.forEach((person) => (person.isDead() && count++));
  return count;
}

function getCanTransmit(){
  var count = 0;
  population.forEach((person) => (person.canTransmit() && count++));
  return count;
}

function getData(first, timeStamp){
  var data = [];
  if(first){
    Object.keys(status).forEach((health) => {
      data.push({
        x: [0],
        y: [0],
        mode: 'lines',
        name: health,
        line: {
          color: healthColors[health],
          dash: 'solid',
          width: 4
        }
      });
    })
    return data;
  }

  var newy = [];
  var newx = [];
  Object.keys(status).forEach((health)=>{
    newx.push([timeStamp / 1000]);
    switch(health){
      case status.healthy : newy.push([getHealthyCount()]); break;
      case status.infected : newy.push([getInfectedCount()]); break;
      case status.sick : newy.push([getSickCount()]); break;
      case status.healed : newy.push([getHealedCount()]); break;
      case status.dead : newy.push([getDeadCount()]); break;
    }
  })
  return {y: newy, x: newx};
}

let lastTimeCheckEnd = 0;
let lastTimeCheckDeaths = 0;
let waitBeforeEnd = 5;

function isTheEnd(){
  return (getCanTransmit() > 0) ? false : true;
}

function gameLoop(timeStamp) {
  var secondsPassed = (timeStamp - oldTimeStamp) / 1000;
  oldTimeStamp = timeStamp;
  
  if(!controlIsTheEnd){
    Plotly.extendTraces('graph1', getData(false, timeStamp), [0,1,2,3,4]);
    elapsedTime.innerHTML = (timeStamp/1000).toFixed(4);
  }
  controlIsTheEnd = isTheEnd();
  
  // Loop over all game objects
  for (var i = 0; i < population.length; i++) {
      population[i].update(secondsPassed);
  }

  loopThroughPeople();
  
  clearCanvas();

  // Do the same to draw
  for (var i = 0; i < population.length; i++) {
      population[i].draw();
  }

  window.requestAnimationFrame(gameLoop);
}









