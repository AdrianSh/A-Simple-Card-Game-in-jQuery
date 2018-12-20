"use strict";

$(() => {
    console.log('page loaded');
    var cardFunctions = {
        _removeFromTurned: (c1) => {
            MyGame.fliptedCards.turned = MyGame.fliptedCards.turned.filter(c => c != c1);
        },
        _unflipCard: (cardId, callback) => {
            window.setTimeout(() => {
                MyGame.workspace.find(`.card${cardId}`).flip(false);
            }, 1000);
            cardFunctions._removeFromTurned(cardId);
            if(callback) callback(cardId);
        },

        unflipCards: () => {
            MyGame.fliptedCards.turned.forEach(c => {
                if(!MyGame.fliptedCards.matchedCards.includes(c))
                    cardFunctions._unflipCard(c);
            });
        },

        _inactiveCards: (c) => {
            let cardE = MyGame.workspace.find(`.card${c}`);
            let beforeE = cardE.before();
            window.setTimeout(() => {
                beforeE.after($(`<div class="card"></div>`));
                cardE.remove();

                paintGame.paintCard(c, (card => {
                    card.find('.front').remove();
                    paintGame.vars.matchedBoard.append(card);
                }));
            }, 1000);
        },

        _flipCard: (cardId, callback) => {
            MyGame.fliptedCards.turned.push(cardId);
            MyGame.workspace.find(`.card${cardId}`).flip(true);
            console.log(`Carta ${cardId} descubierta!`);
            if(callback) callback(cardId);
        },
        
        flipCard: (event, cardId, callback) => {
            console.log(`Girando la carta ${cardId}, actualmente hay ${MyGame.fliptedCards.turned.length} cartas giradas.`);
            if (MyGame.fliptedCards.turned.length >= 2){
                cardFunctions.unflipCards(); // Mientras que hayan al menos dos cartas giradas bloqueamos otros movimientos hasta que se giren
            } else {
                if(MyGame.fliptedCards.matchedCards.includes(cardId)){
                    console.log(`Esa carta ya la has emparejado ${cardId}`);
                } else cardFunctions._flipCard(cardId, cId => {
                    if(MyGame.fliptedCards.turned.length == 2){
                        console.log('Dos cartas giradas!');
                        let c1 = MyGame.fliptedCards.turned[0], c2 = MyGame.fliptedCards.turned[1];
                        if(cardFunctions.matchCards(c1, c2)){
                            cardFunctions._matchCards(c1, c2);
                            callback([c1, c2], true);
                        } else {
                            cardFunctions._unflipCard(c1);
                            cardFunctions._unflipCard(c2);
                            callback([c1, c2], false);
                        }
                    } else {
                        callback(cardId, null);
                    }
                });
            }
        },

        _matchCards: (c1, c2) => {
            cardFunctions._removeFromTurned(c1);
            cardFunctions._removeFromTurned(c2);
            cardFunctions._inactiveCards(c1);
            cardFunctions._inactiveCards(c2);
            MyGame.fliptedCards.matchedCards.push(c1);
            MyGame.fliptedCards.matchedCards.push(c2);
        },
        
        matchCards: (cardId1, cardId2) => {
            if (cardId1 >= MyGame.numCards || cardId2 >= MyGame.numCards)
                console.error("What! Se ha dado click en una carta que no es del juego!!");
            return MyGame.pairs[cardId1] == cardId2;
        }
    };

    var MyGame = {
        numCards: 0,
        numClicks: 0,
        levels: [{
            label: 'Facil', numCards: 12, numRows: 2,
            /* En cada posicion del array esta su carta pareja */
            pairs: [1, 0, 3, 2, 5, 4, 7, 6, 9, 8, 11, 10]
        },
        { label: 'Medio', numCards: 24, numRows: 3,
            /* En cada posicion del array esta su carta pareja */
            pairs: [1, 0, 3, 2, 5, 4, 7, 6, 9, 8, 11, 10, 13, 12, 15, 14, 17, 16, 19, 18, 21, 20, 23, 22] },
        { label:'Dificil', numCards: 36, numRows: 4 }],
        currentLevel: 'Facil',
        pairs: [],
        fliptedCards: { matchedCards: [], turned: [], },
        painter: null,
        workspace: null,
        listeners: [{ event: 'click', target: 'input[name="level"]', func: e => { MyGame.setLevel($(e.target).val()); } },
        {
            event: 'click', target: 'div[class^="card"]', func: e => {
                let cardId = $(e.target.parentElement.parentElement).attr('class').replace('card', '');
                console.log(`Listener llamado sobre la carta ${cardId}`);
                if(!isNaN(cardId))
                cardFunctions.flipCard(e, cardId, (c, match) => {
                    ++MyGame.numClicks;
                    $('#scoreClicks').text(`${MyGame.numClicks}`);

                    if(match){
                        console.log(`Que bien!! Has emparejado ${c[0]} con ${c[1]}`);
                    }
                });
            }
        },
        {
            event: 'click', target: 'input[type="submit"]', func: e => {
                MyGame.numClicks = 0;
                $('#scoreClicks').text(`${MyGame.numClicks}`);
                MyGame.loadGameLevel();
                e.preventDefault();
            }
        }
        ],

        init: () => {
            if (typeof (window.jQuery) == 'undefined' || !window.jQuery) { console.error('No se ha cargado aun jQuery'); return; }
            MyGame.setLevel('Facil');
            MyGame.workspace = $('#myGame');
            MyGame.painter = paintGame;
            MyGame.painter.init(MyGame.workspace);
            MyGame.registerEventListeners();
            console.log('Juego inicializado!');
        },
        loadGameLevel: () => {
            MyGame.painter.removeBoard();
            MyGame.painter.paintBoard();
            paintGame.vars.matchedBoard.html('');
        },
        registerEventListeners: () => {
            MyGame.listeners.forEach(l => {
                MyGame.workspace.on(l.event, l.target, l.func);
            });
        },
        setLevel: level => {
            MyGame.currentLevel = level;
            let levelInfo = MyGame.levels.filter(l => l.label == level)[0];
            MyGame.pairs = levelInfo.pairs;
            MyGame.numCards = levelInfo.numCards;
            MyGame.numRows = levelInfo.numRows;
            MyGame.fliptedCards.matchedCards = new Array(levelInfo.numCards);
            MyGame.fliptedCards.turned = [];
        }
    }

    var paintGame = {
        vars: { myGame: null },
        init: (e) => {
            if (!e) { console.error('No se ha encontrado el contenedor principal en el cual pintar el juego!'); return; }
            console.log('Vamos a comenzar a pintar el juego!');
            paintGame.vars.myGame = e;
            
            paintGame.paintMenu(() => {
                paintGame.vars.myGame.find(`input[value="${MyGame.currentLevel}"]`).prop("checked", true);
            });

            paintGame.paintMathedBoard();
            paintGame.paintBoard();
        },
        paintMenu: (callback) => {
            paintGame.vars.menu = $('<div class="menu">');

            MyGame.levels.forEach(l => {
                paintGame.vars.menu.append($(`<p><input type="radio" id="${l.label}" name="level" value="${l.label}">${l.label}</p>`));
            });

            paintGame.vars.menu.append($('<input type="submit" value="Iniciar">'));

            paintGame.vars.menu.append(`<h1><span id="scoreClicks">${MyGame.numClicks}</span> clicks</h1>`);
            paintGame.vars.myGame.append(paintGame.vars.menu);

            if(callback) callback();
        },
        paintMathedBoard: (callback) => {
            paintGame.vars.matchedBoard = $('<section class="matchedBoard">');
            paintGame.vars.myGame.append(paintGame.vars.matchedBoard);
            if(callback) callback();
        },
        removeBoard: () => {
            paintGame.vars.myGame.find('.board').remove();
        },
        paintCard: (c, callback) => {
            if(c){
                let cImg = paintGame.vars.equivCards[c];
                let card = $(`<div class="card${c}">`);
                let cardFront = $(`<div class="front"><img src="cardBack.png"></div>`);
                let cardBack = $(`<div class="back"><img src="cards/card${parseInt(cImg) + 1}.png"></div>`);
                card.append(cardFront);
                card.append(cardBack);
                if(callback) callback(card); else return card;
            } else { 
                let numCard = Math.floor(Math.random() * paintGame.vars.unpaintedCards.length);
                // Busco una carta aleatoria que no este pintada
                let CardId = paintGame.vars.unpaintedCards[numCard];
                paintGame.vars.unpaintedCards.splice(numCard, 1);
                paintGame.vars.paintedCards.push(CardId);
                
                let cImg = paintGame.vars.equivCards[CardId];
                let card = $(`<div class="card${CardId}">`);
                let cardFront = $(`<div class="front"><img src="cardBack.png"></div>`);
                let cardBack = $(`<div class="back"><img src="cards/card${parseInt(cImg) + 1}.png"></div>`);
                card.append(cardFront);
                card.append(cardBack);
                if(callback) callback(card); else return card;
            }
        },
        paintBoard: () => {
            paintGame.vars.board = $('<section class="board">');
            paintGame.vars.board.cards = [];
            paintGame.vars.paintedCards = [];
            paintGame.vars.unpaintedCards = [];
            paintGame.vars.equivCards = Array(MyGame.numCards);
            
            for (let i = 0; i < MyGame.numCards; i++) { paintGame.vars.unpaintedCards.push(i); }

            let i = 0;
            MyGame.pairs.forEach(c => {
                paintGame.vars.equivCards[c] = i;
                paintGame.vars.equivCards[MyGame.pairs[c]] = i;
                i++;
            });

            for (let row = 0; row < MyGame.numRows; ++row) {
                let numColumns = MyGame.numCards / MyGame.numRows;
                let currentRow = $(`<section class="row" name="row${row}">`);    

                for (let column = 0; column < numColumns; ++column) {
                    paintGame.paintCard(null, card => {
                        card.flip();             
                        currentRow.append(card);
                    });
                }

                paintGame.vars.board.append(currentRow);
            }

            paintGame.vars.myGame.append(paintGame.vars.board);
        }
    };



    MyGame.init();
});