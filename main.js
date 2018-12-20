"use strict";

$(() => {
    console.log('page loaded');
    var cardFunctions = {
        unflipCard: (callback) => {
            cardFunctions._getUndiscoveredCard(undisCards => {
                undisCards.forEach(cardFound => {
                    console.log(`Checked cards: ${MyGame.checkedCards.length}`);
                    console.log(MyGame.checkedCards.cards);
                    MyGame.workspace.find(`.card${cardFound.card.id}`).flip(false);
                    MyGame.checkedCards.cards.splice(cardFound.pos);
                    MyGame.checkedCards.length--;
                    console.log(`Carta ocultada ${cardFound.card.id}`);
                });

                if (callback != null) {
                    callback();
                }
            });
        },

        _getUndiscoveredCard: (callback) => {
            let undisCards = [];
            for (let i = 0; i < MyGame.checkedCards.cards.length && undisCards.length < 2; i++) {
                if (!MyGame.checkedCards.cards[i].discovered) {
                    undisCards.push({ pos: i, card: MyGame.checkedCards.cards[i] });
                }
            }

            callback(undisCards);
        },

        flipCard: (cardId, callback) => {
            if (MyGame.checkedCards.length >= 2) {
                cardFunctions.unflipCard();
            } else {
                cardFunctions._flipCard(cardId);

                if (MyGame.checkedCards.length >= 2) {
                    cardFunctions._getUndiscoveredCard(undisCards => {
                        console.log(`Cartas giradas:`);
                        console.log(undisCards);

                        if (undisCards.length < 2) {
                            return;
                        }

                        let cardFound1 = undisCards[0];
                        let cardFound2 = undisCards[1];

                        if (cardFunctions.matchCards(cardFound1.card.id, cardFound2.card.id)) {
                            MyGame.checkedCards.cards[cardFound1.pos].discovered = true;
                            MyGame.checkedCards.cards[cardFound2.pos].discovered = true;
                        } else {
                            setTimeout(() => {
                                cardFunctions.unflipCard();
                            }, 2000);
                        }

                        callback();
                    });
                }
            }
        },

        _flipCard: (cardId) => {
            MyGame.checkedCards.length++;
            MyGame.checkedCards.cards.push({ id: cardId, discovered: false });
            console.log(`Carta ${cardId} descubierta!`);
        },

        matchCards: (cardId1, cardId2) => {
            if (cardId1 >= MyGame.numCarts || cardId2 >= MyGame.numCarts) {
                console.error("What! Se ha dado click en una carta que no es del juego!!");
            }
            return MyGame.pairs[cardId1] == cardId2;
        }
    };

    var MyGame = {
        numCarts: 0,
        numClicks: 0,
        levels: [{
            label: 'Facil', numCarts: 12, numRows: 2,
            /* En cada posicion del array esta su carta pareja */
            pairs: [1, 0, 3, 2, 5, 4, 7, 6, 9, 8, 11, 10]
        },
        { label: 'Medio', numCarts: 24, numRows: 3 },
        { label: 'Dificil', numCarts: 36, numRows: 4 }],
        currentLevel: 'Facil',
        pairs: [],
        checkedCards: { length: 0, cards: [] },
        painter: null,
        workspace: null,
        listeners: [{ event: 'click', target: 'input[name="level"]', func: e => { MyGame.setLevel($(e.target).val()); } },
        {
            event: 'click', target: 'div[class^="card"]', func: e => {
                let cardId = $(e.target.parentElement.parentElement).attr('class').replace('card', '');
                cardFunctions.flipCard(cardId, () => {
                    ++MyGame.numClicks;
                    $('#scoreClicks').text(`${MyGame.numClicks}`);
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
            MyGame.numCarts = levelInfo.numCarts;
            MyGame.numRows = levelInfo.numRows;
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

            paintGame.paintBoard();
        },

        paintMenu: (callback) => {
            paintGame.vars.menu = $('<form class="menu">');

            MyGame.levels.forEach(l => {
                paintGame.vars.menu.append($(`<p><input type="radio" id="${l.label}" name="level" value="${l.label}">${l.label}</p>`));
            });

            paintGame.vars.menu.append($('<input type="submit" value="Iniciar">'));

            paintGame.vars.menu.append(`<h1><span id="scoreClicks">${MyGame.numClicks}</span> clicks</h1>`);
            paintGame.vars.myGame.append(paintGame.vars.menu);

            callback();
        },

        removeBoard: () => {
            paintGame.vars.myGame.find('.board').remove();
        },

        paintBoard: () => {
            paintGame.vars.board = $('<section class="board">');
            paintGame.vars.board.cards = [];

            for (let row = 0; row < MyGame.numRows; ++row) {
                let numColumns = MyGame.numCarts / MyGame.numRows;
                let currentRow = $(`<section class="row" name="row${row}">`);

                for (let column = 0; column < numColumns; ++column) {
                    var card = $(`<div class="card${row + column}">`);
                    var cardFront = $(`<div class="back"><img src="cardFront.png"></div>`);
                    var cardBack = $(`<div class="front"><img src="./cards/cardBack.png"></div>`);
                    card.append(cardBack);
                    card.append(cardFront);
                    card.flip();
                    currentRow.append(card);
                }

                paintGame.vars.board.append(currentRow);
            }

            paintGame.vars.myGame.append(paintGame.vars.board);
        }
    };



    console.log(MyGame.init());
});