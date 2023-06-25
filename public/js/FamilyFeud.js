console.clear()


var app = {
    version: 1,
    role: "player",
    socket: io.connect(),
    jsonFile: "../public/data/FamilyFeud_Questions.json",
    currentQ: 0,
    wrong:0,
    board: $(`<div class='gameBoard'>

                <!--- Scores --->
                <div class='score' id='boardScore'>0</div>
                <div class="timer-container">
                    <time id="timer">0:00:00.00</time>
                    <button id="toggle">Start</button>
                    <button id="clear">clear</button>
                </div>
                <!--- Main Board --->
                <div id='middleBoard'>

                    <!--- Question --->
                    <div class='questionHolder'>
                        <span class='question'></span>
                    </div>

                    <!--- Answers --->
                    <div class='colHolder'>
                    </div>

                </div>
                <!--- Wrong --->
                <div class='wrongX wrongBoard'>
                    <img alt="not on board" src="/public/img/Wrong.svg"/>
                    <img alt="not on board" src="/public/img/Wrong.svg"/>
                    <img alt="not on board" src="/public/img/Wrong.svg"/>
                </div>

                <!--- Buttons --->
                <div class='btnHolder hide' id="host">
                    <div id='newQuestion' class='button'>New Question</div>
                    <div id="wrong"       class='button wrongX'>
                        <img alt="not on board" src="/public/img/Wrong.svg"/>
                    </div>
                </div>

                </div>`),
    
    // Utility functions
    shuffle: (array) => {
        var currentIndex = array.length,
            temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    },
    jsonLoaded: (data) => {
        app.allData = data;
        app.questions = Object.keys(data);
        app.makeQuestion(app.currentQ);
        app.board.find('.host').hide();
        $('body').append(app.board);
    },

    // Action functions
    makeQuestion: (eNum) => {
        var qText = app.questions[eNum];
        var qAnswr = app.allData[qText];

        var qNum = qAnswr.length;
        qNum = (qNum < 8) ? 8 : qNum;
        qNum = (qNum % 2 != 0) ? qNum + 1 : qNum;

        var boardScore = app.board.find("#boardScore");
        var question = app.board.find(".question");
        var holderMain = app.board.find(".colHolder");

        boardScore.html(0);
        question.html(qText.replace(/&x22;/gi, '"'));
        holderMain.empty();

        app.wrong = 0;
        var wrong = app.board.find(".wrongBoard")
        $(wrong).find("img").hide()
        $(wrong).hide()

        qNum = 10

        for (var i = 0; i < qNum; i++) {
            var aLI;
            if (qAnswr[i]) {
                aLI = $(`<div class='cardHolder'>
                            <div class='card' data-id='${i}'>
                                <div class='front'>
                                    <span class='DBG'>${(i + 1)}</span>
                                    ${app.role === 'coHost' ? "<span class='answer'>"+qAnswr[i][0]+"</span>": ""}
                                </div>
                                <div class='back DBG'>
                                    <span>${qAnswr[i][0]}</span>
                                    <b class='LBG'>${qAnswr[i][1]}</b>
                                </div>
                            </div>
                        </div>`)
            } else {
                aLI = $(`<div class='cardHolder empty'><div></div></div>`)
            }

            var parentDiv = holderMain//(i < (qNum / 2)) ? col1 : col2;
            aLI.on('click', {
                trigger: 'flipCard',
                num: i
            }, app.talkSocket);
            $(aLI).appendTo(parentDiv)
        }

        var cardHolders = app.board.find('.cardHolder');
        var cards = app.board.find('.card');
        var backs = app.board.find('.back');
        var cardSides = app.board.find('.card>div');

        TweenLite.set(cardHolders, {
            perspective: 800
        });
        TweenLite.set(cards, {
            transformStyle: "preserve-3d"
        });
        TweenLite.set(backs, {
            rotationX: 180
        });
        TweenLite.set(cardSides, {
            backfaceVisibility: "hidden"
        });
        cards.data("flipped", false);
    },
    getBoardScore: () => {
        var cards = app.board.find('.card');
        var boardScore = app.board.find('#boardScore');
        var currentScore = {
            var: boardScore.html()
        };
        var score = 0;

        function tallyScore() {
            if ($(this).data("flipped")) {
                var value = $(this).find("b").html();
                score += parseInt(value)
            }
        }
        $.each(cards, tallyScore);
        TweenMax.to(currentScore, 1, {
            var: score,
            onUpdate: function () {
                boardScore.html(Math.round(currentScore.var));
            },
            ease: Power3.easeOut
        });
    },
    awardPoints: (num) => {
        var boardScore = app.board.find('#boardScore');
        var currentScore = {
            var: parseInt(boardScore.html())
        };
        var team = app.board.find("#team" + num);
        var teamScore = {
            var: parseInt(team.html())
        };
        var teamScoreUpdated = (teamScore.var + currentScore.var);
        TweenMax.to(teamScore, 1, {
            var: teamScoreUpdated,
            onUpdate: function () {
                team.html(Math.round(teamScore.var));
            },
            ease: Power3.easeOut
        });

        TweenMax.to(currentScore, 1, {
            var: 0,
            onUpdate: function () {
                boardScore.html(Math.round(currentScore.var));
            },
            ease: Power3.easeOut
        });
    },
    changeQuestion: () => {
        app.currentQ++;
        app.makeQuestion(app.currentQ);
    },
    makeHost: () => {
        app.role = "host";
        app.board.find(".hide").removeClass('hide');
        app.board.addClass('showHost');
        app.socket.emit("talking", {
            trigger: 'hostAssigned'
        });
    },
    makeCoHost: () => {
        app.role = "coHost";
    },
    flipCard: (n) => {
        console.log("card");
        console.log(n);
        var card = $('[data-id="' + n + '"]');
        var flipped = $(card).data("flipped");
        var cardRotate = (flipped) ? 0 : -180;
        TweenLite.to(card, 1, {
            rotationX: cardRotate,
            ease: Back.easeOut
        });
        flipped = !flipped;
        $(card).data("flipped", flipped);
        app.getBoardScore()
    },
    wrongAnswer:()=>{
        app.wrong++
        console.log("wrong: "+ app.wrong )
        var wrong = app.board.find(".wrongBoard")
        $(wrong).find("img:nth-child("+app.wrong+")").show()
        $(wrong).show()
        setTimeout(() => { 
            $(wrong).hide(); 
        }, 1000); 

    },

    // Socket Test
    talkSocket: (e) => {
        if (app.role == "host" || app.role == "coHost") app.socket.emit("talking", e.data);
    },
    listenSocket: (data) => {
        console.log(data);
        switch (data.trigger) {
            case "newQuestion":
                app.changeQuestion();
                break;
            case "awardTeam1":
                app.awardPoints(1);
                break;
            case "awardTeam2":
                app.awardPoints(2);
                break;
            case "flipCard":
                app.flipCard(data.num);
                break;
            case "hostAssigned":
                // app.board.find('#hostBTN').remove();
                break;
            case "wrong":
                app.wrongAnswer()
                break;
        }
    },
    
    // Inital function
    init: () => {

        $.getJSON(app.jsonFile, app.jsonLoaded);

        if(window.location.pathname.includes('host')){
            app.makeHost()
        }

        if(window.location.pathname.includes('co-host')){
            app.makeCoHost()
        }

        app.board.find('#awardTeam1' ).on('click', { trigger: 'awardTeam1' }, app.talkSocket);
        app.board.find('#awardTeam2' ).on('click', { trigger: 'awardTeam2' }, app.talkSocket);
        app.board.find('#newQuestion').on('click', { trigger: 'newQuestion'}, app.talkSocket);
        app.board.find('#wrong'      ).on('click', { trigger: 'wrong'      }, app.talkSocket);

        app.socket.on('listening', app.listenSocket)

        function timer() {
            'use strict';
            var output = document.getElementById('timer');
            var toggle = document.getElementById('toggle');
            var clear = document.getElementById('clear');
            var running = false;
            var paused = false;
            var timer;
            
            // timer start time
            var then;
            // pause duration
            var delay;
            // pause start time
            var delayThen;
        
            
            // start timer
            var start = function() {
                delay = 0;
                running = true;
                then = Date.now();
                timer = setInterval(run,51);
                toggle.innerHTML = 'stop';
            };
            
            
            // parse time in ms for output
            var parseTime = function(elapsed) {
                // array of time multiples [hours, min, sec, decimal]
                var d = [3600000,60000,1000,10];
                var time = [];
                var i = 0;
        
                while (i < d.length) {
                    var t = Math.floor(elapsed/d[i]);
        
                    // remove parsed time for next iteration
                    elapsed -= t*d[i];
        
                    // add '0' prefix to m,s,d when needed
                    t = (i > 0 && t < 10) ? '0' + t : t;
                    time.push(t);
                    i++;
                }
                
                return time;
            };
            
            
            // run
            var run = function() {
                // get output array and print
                var time = parseTime(Date.now()-then-delay);
                output.innerHTML = time[0] + ':' + time[1] + ':' + time[2] + '.' + time[3];
            };
            
            
            // stop
            var stop = function() {
                paused = true;
                delayThen = Date.now();
                toggle.innerHTML = 'resume';
                clear.dataset.state = 'visible';
                clearInterval(timer);
        
                // call one last time to print exact time
                run();
            };
            
            
            // resume
            var resume = function() {
                paused = false;
                delay += Date.now()-delayThen;
                timer = setInterval(run,51);
                toggle.innerHTML = 'stop';
                clear.dataset.state = '';
            };
            
            
            // clear
            var reset = function() {
                running = false;
                paused = false;
                toggle.innerHTML = 'start';
                output.innerHTML = '0:00:00.00';
                clear.dataset.state = '';
            };
            
            
            // evaluate and route
            var router = function() {
                if (!running) start();
                else if (paused) resume();
                else stop();
            };
            
            toggle.addEventListener('click',router);
            clear.addEventListener('click',reset);
            
        
            //declare
        };

        setTimeout(() => {
            timer()
        }, 2000);
        
    }
};
app.init();