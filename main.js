"use strict";

$(() => {
    console.log('page loaded');
    var cardFunctions = {
        unflipCard: () => {
            let cardFound = cardFunctions._getUndiscoveredCard();
            MyGame.checkedCards.cards.splice(cardFound.pos);
            MyGame.checkedCards.length--;

            console.log(`Carta ocultada ${cardFound.card.id}`);
        },
        _getUndiscoveredCard: () => {
            for (let i = 0; i < MyGame.checkedCards.cards.length; i++) {
                if(!MyGame.checkedCards.cards[i].discovered);
                return {pos: i, card: MyGame.checkedCards.cards[i]};
            }
        },
        flipCard: (cardId) => {
            if(MyGame.checkedCards.length >= 2)
                cardFunctions.unflipCard();
            
            cardFunctions._flipCard(cardId);

            if(MyGame.checkedCards.length >= 2){
                let cardFound1 = cardFunctions._getUndiscoveredCard();
                let cardFound2 = cardFunctions._getUndiscoveredCard();

                if(cardFunctions.matchCards(cardFound1.card.id, cardFound2.card.id)){ 
                    MyGame.checkedCards.cards[cardFound1.pos].discovered = true;
                    MyGame.checkedCards.cards[cardFound2.pos].discovered = true;
                } else {
                    setTimeout(() => {
                        cardFunctions.unflipCard();
                        cardFunctions.unflipCard();
                    }, 2000);
                }
            }
        },
        _flipCard: (cardId) => {
            MyGame.checkedCards.length++;
            MyGame.checkedCards.cards.push({id: cardId, discovered: false});
            console.log(`Carta ${cardId} descubierta!`);
        },
        matchCards: (cardId1, cardId2, callback) => {
            if(cardId1 >= MyGame.numCarts || cardId2 >= MyGame.numCarts )
                console.error("What! Se ha dado click en una carta que no es del juego!!");
            return MyGame.pairs[cardId1] == cardId2;
        }
    };

    var MyGame = {
        numCarts: 0,
        levels: [{ label: 'Facil', numCarts: 12,
                    /* En cada posicion del array esta su carta pareja */
                    pairs: [1,0,3,2,5,4,7,6,9,8,11,10] },
                { label: 'Medio', numCarts: 24 },
                { label: 'Dificil', numCarts: 36 }],
        currentLevel: 'Facil',
        pairs: [],
        checkedCards: { length: 0, cards: []},
        painter: null,
        workspace: null,
        listeners: [{ event: 'click', target: 'input[name="level"]', func: e => { MyGame.setLevel($(e.target).val()); } },
            { event: 'click', target: 'input[type="checkbox"]', func: e => {
                let cardId = e.target.name.replace('card', '');
                cardFunctions.flipCard(cardId);
            }}
        ],

        init: () => {
            if (typeof (window.jQuery) == 'undefined' || !window.jQuery) { console.error('No se ha cargado aun jQuery'); return; }
            MyGame.setLevel('Facil');
            MyGame.workspace = $('#myGame');
            MyGame.painter = paintGame.init(MyGame.workspace);

            MyGame.registerEventListeners();
            console.log('Juego inicializado!');
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
        }
    }

    var paintGame = {
        vars: { myGame: null},
        init: (e) => {
            if (!e) { console.error('No se ha encontrado el contenedor principal en el cual pintar el juego!'); return; }
            console.log('Vamos a comenzar a pintar el juego!');
            paintGame.vars.myGame = e;

            paintGame.paintMenu();
            paintGame.paintBoard();
        },
        paintMenu: () => {
            paintGame.vars.menu = $('<section class="menu">');
            paintGame.vars.menu.append($('<input type="submit" value="Iniciar">'));

            MyGame.levels.forEach(l => {
                paintGame.vars.menu.append($(`<p><input type="radio" name="level" value="${l.label}">${l.label}</p>`));
            });

            paintGame.vars.menu.append(`<h1><span id="scoreClicks">0</span> clicks</h1>`);
            paintGame.vars.myGame.append(paintGame.vars.menu);
        },
        paintBoard: () => {
            paintGame.vars.board = $('<section class="board">');
            paintGame.vars.board.cards = [];
            for (let i = 0; i < MyGame.numCarts; i++) {
                var card = $(`<input type="checkbox" name="card${i}">`);
                paintGame.vars.board.cards.push(card);
                paintGame.vars.board.append(card);
            }
            paintGame.vars.myGame.append(paintGame.vars.board);
        }
    };



    console.log(MyGame.init());
});