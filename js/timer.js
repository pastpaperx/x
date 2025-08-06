// #################################################### Objects & Variables #################################################################

// --------------------------------------------------- time interval settings ---------------------------------------------------------------
let tActive = 2.5//*60; // time for one session-block in s
let tShortBreak = 1//*60; // time for short break in s
//let tLongBreak = 1.5//*60; // time for longer break (once every 4 sessions) in s
let counter = 0; // counts nr of session-blocks completed

// ----------------------------------------------------------- timer ------------------------------------------------------------------------
let timer;
let timerID;
let focused;

// ---------------------------------------------------- active break: tipps, scores, messages -----------------------------------------------
let tips = ['Trink was 💧', 'Snack ein Obst 🍏', 'Beweg dich 💃', 'Öffne das Fenster 🦨', 'Geh kurz mal raus ☀️', 'Atme kurz durch 🌪️']; 
let xMax, yMax, zMax;

// ------------------------------------------------------------- sounds ---------------------------------------------------------------------
let ring1 = new Audio('/sounds/bell-1x.mp3');
let ring2 = new Audio('/sounds/bell-2x.mp3');


// ############################################################## LOGIC #####################################################################

window.onload = init();

let tasks = [];
let fin_tasks = [];

function sync_display(v, id) {
    $(`#${id}`).html(v)
}

function drawTask(){
  tasks.sort((a,b)=>b.importance - a.importance);
  let ul = $('#pending_tasks');
  ul.empty()
  for (let i = 0; i < tasks.length; i++) {
    
    if(timerID && i ===0){
        ul.append(`<li>${tasks[i].taskname} (${tasks[i].importance}) </li>`)
    }else {
        ul.append(`<li>${tasks[i].taskname} (${tasks[i].importance}) <button type="button" onclick="finishTask(${i});"> ${$('#i18n_t_finish').val()} </button></li>`)
    }
  }
  ul = $('#finished_tasks');
  ul.empty()
  for (let i = 0; i < fin_tasks.length; i++) {
    ul.append(`<li>${fin_tasks[i].taskname} (${fin_tasks[i].importance}) <button type="button" onclick="restoreFinTask(${i});"> ${$('#i18n_t_redo').val()} </button> <button type="button" onclick="removeFinTask(${i});"> X </button></li>`);    
  }
}

function finishTask(i){
    const old = tasks.splice(i, 1);
    fin_tasks[fin_tasks.length] = old[0];
    drawTask()
}
function restoreFinTask(i){
    const old = fin_tasks.splice(i, 1);
    tasks[tasks.length] = old[0];
    drawTask()
}
function removeFinTask(i){
    fin_tasks.splice(i, 1)
    drawTask()
}
// {t:'string',o:-10~10}
function addTask(that){
  const opt = {};
  $(that).serializeArray().forEach(({name, value}) => {
    if(value){
      opt[name] = value;
    }
  });
  tasks[tasks.length] = opt;
  drawTask()
}

function task_duration_input(v, id){
    tActive = 60*v;
    $(`#${id}`).html(`${tActive/60} ${$('#i18n_minute').val()}`);
    if(!timerID){
        setTimer(tActive)
    }
}

function break_druation_input(v, id){
    tShortBreak = 60*v;
    $(`#${id}`).html(`${tShortBreak/60} ${$('#i18n_minute').val()}`);
}

function init(){
    focused = true;
    setTimer(tActive);
    $('#importance').trigger('input');
    $('#task_druation').trigger('input');
    $('#break_druation').trigger('input');
}

function startSession(){
    countdown();
    drawTask()
}

function stopSession(){
    clearInterval(timerID);
    timerID = null;
}

function takeBreak(){
    // hide button during break
    let btn = document.getElementById('btn');
    btn.style.visibility = "hidden";
    btn.style.display = "none";

    // set time according to number of session-blocks 
    let time;
    if(counter < 4){
        //short break
        time = tShortBreak;
    } else {
        // longer break (every 4 blocks)
        time = tLongBreak;
        // new round
        counter = 0;
    }
    setTimer(time);
    countdown();
}

function setTimer(time){
    timer = time;
    let minutes, seconds;
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);
    
    // Fill in leading 0 if necessary
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    
    // Ausgabe
    document.getElementById('timer').innerHTML = minutes + ":" + seconds;
}

function countdown() {
    $('#current_task').html(tasks.length > 0 ? `${$('#i18n_current_task').val()} ${tasks[0].taskname}` : $('#i18n_no_task').val());

    timerID = setInterval(function () {
        setTimer(timer);
        if (--timer < 0) {
            clearInterval(timerID);
            timerID = null;
            if (focused) {
                ring1.play();
                counter++;
                focused = false;
                updateStreak();
                takeBreak();
                
            } else {
                ring2.play();
                if(laSensor != null){
                    endActiveBreak();
                }
                endBreak();
            }
        }
    }, 1000); // invoked every second
}

function endActiveBreak(){
    // $('#score')
    // remove scores and messages from view
    document.getElementById('score').style.display = "none";
    document.getElementById('score').style.visibility = "hidden";  
    document.getElementById('start-msg').style.display = "none";
    document.getElementById('start-msg').style.visibility = "hidden";
    document.getElementById('end-msg').style.display = "none";
    document.getElementById('end-msg').style.visibility = "hidden";
    
}

function endBreak() {
    setTimer(tActive);
    focused = true;
    // bring back Button
    let btn = document.getElementById('btn');
    btn.innerHTML = $('#i18n_start').val();
    btn.onclick = startBtn;
    btn.style.visibility = "visible";
    btn.style.display = "block";
    // change messages displayed
    resetMsg();
    document.getElementById('label').innerHTML = "Und weiter geht's!";
}

function startBtn(){
    let btn = document.getElementById('btn');
    btn.innerHTML = $('#i18n_end').val();
    btn.onclick = stopBtn;
    resetMsg();
    startSession();
}

function resetClock(){
    if(timerID) stopBtn();
    setTimer(tActive)
}

function stopBtn(){
    let btn = document.getElementById('btn');
    btn.innerHTML = $('#i18n_start').val();
    btn.onclick = startBtn;
    stopSession();
}

function setMessage(txt) {
    let msg = document.getElementById('message')
    msg.innerHTML = txt;
    msg.style.visibility = "visible";
    msg.style.display = "block";
}

function resetMsg(){
    let msg = document.getElementById('message')
    msg.innerHTML = "";
    msg.style.visibility = "hidden";
    msg.style.display = "none";
}

function updateStreak(){
    if(tasks.length > 0){
        finishTask(0);
    }
}


function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// val - {xMax, yMax, zMax}, label - {xBar, yBar, zBar}
function move(label, val){
    let bar = document.getElementById(label);
    if (val < 100){
        bar.style.height = val + "%";
    } else {
        bar.style.height = "100%";
    }
}


function activeBreak(){
    resetScore();
    document.getElementById('score').style.display = "flex";
    document.getElementById('score').style.visibility = "visible";
    document.getElementById('start-msg').style.display = "block";
    document.getElementById('start-msg').style.visibility = "visible";
    laSensor.removeEventListener('reading', dontTouch);
    laSensor.addEventListener('reading', showScore);
}
