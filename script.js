window.addEventListener("load",Init);

const GAME = {
    name : "",
    id : 0,
    headers: new Headers(),
    website: "https://ttt-practice.azurewebsites.net",
    canMove:false
};

function Init() {
    let $radio = document.querySelectorAll('[data-component = "radioChoice"');
    let $nameBtn = document.querySelector('[data-component = "btnSubmit"');
    let $btnStart = document.querySelector('[data-component = "btnStart"]');
    GAME.headers.append('Content-Type', 'application/json');

    $nameBtn.addEventListener("click",onButtonSubmit);
    $radio.forEach( radio => radio.addEventListener("change",onRadioChange));
    $btnStart.addEventListener("click",onButtonStart);
}

function onButtonSubmit() {
    let $name = document.querySelector('[data-component="name"');
    let $nameBtn = document.querySelector('[data-component="btnSubmit"');

    $nameBtn.parentNode.removeChild($nameBtn);
    $name.parentNode.removeChild($name);
    createName($name.value);
}

function createName(name){
    let $container = document.querySelector('[data-component="fieldUser"');
    let $el = document.createElement("div");
    GAME.name = name;

    $el.id = "user-name";
    $el.innerHTML = name;
    $container.appendChild($el);
}

function onRadioChange() {
    changeGameInnerHTML();
}

function changeGameInnerHTML(){
    let $elements = document.querySelectorAll('td');
    for (let i = 0; i < $elements.length; i++){
        if ($elements[i].innerHTML == "X"){
            $elements[i].innerHTML = "O"
        } else if ($elements[i].innerHTML == "O") {
            $elements[i].innerHTML = "X"
        }
    }
}


function onClick(event) {
    if (!GAME.canMove){
        return;
    }

    let $elements = document.querySelectorAll('td');
    let $el = event.target;
    let x = $el.cellIndex;
    let y = $el.parentElement.rowIndex;
    let position = x+y*3;

    $elements[x+y*3].innerHTML = getYourMark();
    $elements[x+y*3].removeEventListener("click",onClick);

    createSpinner();
    GAME.canMove = false;
    makeTurnFetch($elements,position);
}

function getYourMark(){
    let $radio = document.querySelectorAll('[data-component="radioChoice"');
    if ($radio[0].checked){
        return $radio[0].value
    } else {
        return $radio[1].value
    }
}

function getEnemyMark(){
    let $radio = document.querySelectorAll('[data-component="radioChoice"');
    if ($radio[0].checked){
        return $radio[1].value
    } else {
        return $radio[0].value
    }
}

function onButtonStart() {
    let $name = document.getElementById("user-name");
    let $nameInput = document.querySelector('[ data-component="name"]');
    if (!$name) {
        alert("Submit your name!");
        $nameInput.style.border = "2px solid red";
        $nameInput.style.color = "red";
        return false;
    }

    let $elements = document.querySelectorAll('td');
    $elements.forEach( elem => elem.addEventListener("click",onClick));
    GAME.canMove = false;
    startFetch($elements);
    GAME.canMove = true;
    //block buttonStart
    document.querySelector('[data-component = "btnStart"]').removeEventListener("click",onButtonStart);

}

function startFetch(elements){
    fetch(GAME.website + "/start/?name=" + GAME.name,{
        method: 'GET',
        headers: GAME.headers
    })
        .then(function(response){
            if (response.status > 300){
                setBanner("sorry, error number: ",response.status,". Try later.");
                return Promise.reject()
            }
            if (response.ok){
                return response.json();
            }
            else{
                setBanner(response.reason);
                return Promise.reject();
            }
        })
        .then(function(json){
            console.log(json);
            GAME.id = json.data.id;

            if (!json.data.canMove){
                GAME.canMove = false;

                setBanner("Ход опонента");
                waitFetch(elements);
                GAME.canMove = true;
            }

            setBanner("Ваш ход");
        });
}

function waitFetch(elements){
    fetch(GAME.website + "/waitMove",{
        method: 'POST',
        body: JSON.stringify({
            name: GAME.name,
            id: GAME.id
        }),
        headers: GAME.headers
    })
        .then((response) => response.json())
        .then( function (response){
                let move = response.data.move;
                elements[move].innerHTML = getEnemyMark();
                elements[move].removeEventListener( "click", onClick);
                GAME.canMove = true;
                setBanner("Ваш ход");
                deleteSpinner();
            }
        )

}

function makeTurnFetch(elements,pos){
    fetch(GAME.website + "/makeMove",{
        method: 'POST',
        body: JSON.stringify({
            name: GAME.name,
            id:GAME.id,
            move: pos
        }),
        headers: GAME.headers
    })
        .then((response) => response.json())
        .then(function(response) {
            if (response.data.win) {
                setBanner("VICTORY!!!")
                elements.forEach(elem => elem.removeEventListener("click",onClick));
                return Promise.reject()
            } else {
                setBanner("Ход опонента")
            }
        })
        .then(function(){
            waitFetch(elements);
        })

}

function createSpinner(){
    let $container = document.querySelector('[data-component = "spinner"]');
    for (let i = 0;i < 3; i++){
        let $el = document.createElement("div");
        $el.className = "bounce"+i+1;
        $container.appendChild($el);
    }
}

function deleteSpinner(){
    document.querySelector('[data-component = "spinner"]').innerHTML = "" ;
}

function setBanner(str){
    let info = document.querySelector('[ data-component="showTurn"]');
    info.innerHTML = str;
}

