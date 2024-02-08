// Declarar todos los objetos de uso común como variables por conveniencia
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

// Solicitud de requestAnimationFrame y cancelAnimationFrame para su uso en el código del juego
(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
})(); //());

$(window).load(function () {
    game.init();
});

var game = {
    // Comenzar inicialización de objetos, precarga de elementos y pantalla de inicio
    init: function () {
        // Inicializar objetos   
        levels.init();
        loader.init();
        mouse.init();

        // Cargar todos los efectos de sonido y música de fondo

        //"Kindergarten" by Gurdonark
        //http://ccmixter.org/files/gurdonark/26491 is licensed under a Creative Commons license
        game.backgroundMusic = loader.loadSound('audio/gurdonark-kindergarten');

        game.slingshotReleasedSound = loader.loadSound("audio/released");
        game.bounceSound = loader.loadSound('audio/bounce');
        game.breakSound = {
            "glass": loader.loadSound('audio/glassbreak'),
            "wood": loader.loadSound('audio/woodbreak')
        };

        // Ocultar todas las capas del juego y mostrar la pantalla de inicio
        $('.gamelayer').hide();
        $('#gamestartscreen').show();

        // Obtener manejador para el canvas del juego y el contexto
        game.canvas = $('#gamecanvas')[0];
        game.context = game.canvas.getContext('2d');

        /**
        // Agregar eventos de ratón para mover la honda
        $('#gamecanvas').mousemove(function (e) {
            // Actualizar las coordenadas de la honda según la posición del cursor
            game.slingshotX = e.pageX - game.canvas.offsetLeft;
            game.slingshotY = e.pageY - game.canvas.offsetTop;
        });*/
    },

    startBackgroundMusic: function () {
        var toggleImage = $("#togglemusic")[0];
        game.backgroundMusic.play();
        toggleImage.src = "images/icons/sound.png";
    },
    stopBackgroundMusic: function () {
        var toggleImage = $("#togglemusic")[0];
        toggleImage.src = "images/icons/nosound.png";
        game.backgroundMusic.pause();
        game.backgroundMusic.currentTime = 0; // Ir al comienzo de la canción
    },
    toggleBackgroundMusic: function () {
        var toggleImage = $("#togglemusic")[0];
        if (game.backgroundMusic.paused) {
            game.backgroundMusic.play();
            toggleImage.src = "images/icons/sound.png";
        } else {
            game.backgroundMusic.pause();
            $("#togglemusic")[0].src = "images/icons/nosound.png";
        }
    },

    showLevelScreen: function () {
        $('.gamelayer').hide();
        $('#levelselectscreen').show('slow');
    },
    restartLevel: function () {
        window.cancelAnimationFrame(game.animationFrame);
        game.lastUpdateTime = undefined;
        levels.load(game.currentLevel.number);
    },
    startNextLevel: function () {
        window.cancelAnimationFrame(game.animationFrame);
        game.lastUpdateTime = undefined;
        levels.load(game.currentLevel.number + 1);
    },

    // Modo Juego 
    mode: "intro",
    // Coordenadas X & Y de la honda
    slingshotX: 140,
    slingshotY: 280,

    start: function () {
        $('.gamelayer').hide();
        // Display the game canvas and score 
        $('#gamecanvas').show();
        $('#scorescreen').show();

        game.startBackgroundMusic();

        game.mode = "intro";
        game.offsetLeft = 0;
        game.ended = false;
        game.animationFrame = window.requestAnimationFrame(game.animate, game.canvas);
    },

    // Velocidad máxima de panoramización por fotograma en píxeles
    maxSpeed: 3,
    // Mínimo y Máximo desplazamiento panorámico
    minOffset: 0,
    maxOffset: 300,
    // Desplazamiento de panorámica actual
    offsetLeft: 0,
    // La puntuación del juego
    score: 0,


    //Despliegue la pantalla para centrarse en newCenter
    panTo: function (newCenter) {
        if (Math.abs(newCenter - game.offsetLeft - game.canvas.width / 4) > 0
            && game.offsetLeft <= game.maxOffset && game.offsetLeft >= game.minOffset) {

            var deltaX = Math.round((newCenter - game.offsetLeft - game.canvas.width / 4) / 2);
            if (deltaX && Math.abs(deltaX) > game.maxSpeed) {
                deltaX = game.maxSpeed * Math.abs(deltaX) / (deltaX);
            }
            game.offsetLeft += deltaX;
        } else {

            return true;
        }
        if (game.offsetLeft < game.minOffset) {
            game.offsetLeft = game.minOffset;
            return true;
        } else if (game.offsetLeft > game.maxOffset) {
            game.offsetLeft = game.maxOffset;
            return true;
        }
        return false;
    },
    countHeroesAndVillains: function () {
        game.heroes = [];
        game.villains = [];
        for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
            var entity = body.GetUserData();
            if (entity) {
                if (entity.type == "hero") {
                    game.heroes.push(body);
                } else if (entity.type == "villain") {
                    game.villains.push(body);
                }
            }
        }
    },
    mouseOnCurrentHero: function () {
        if (!game.currentHero) {
            return false;
        }
        var position = game.currentHero.GetPosition();
        var distanceSquared = Math.pow(position.x * box2d.scale - mouse.x - game.offsetLeft, 2) + Math.pow(position.y * box2d.scale - mouse.y, 2);
        var radiusSquared = Math.pow(game.currentHero.GetUserData().radius, 2);
        return (distanceSquared <= radiusSquared);
    },
    handlePanning: function () {
        if (game.mode == "intro") {
            if (game.panTo(700)) {
                game.mode = "load-next-hero";
            }
        }

        if (game.mode == "wait-for-firing") {
            if (mouse.dragging) {
                if (game.mouseOnCurrentHero()) {
                    game.mode = "firing";
                } else {
                    game.panTo(mouse.x + game.offsetLeft)
                }
            } else {
                game.panTo(game.slingshotX);
            }
        }

        if (game.mode == "firing") {
            if (mouse.down) {
                game.panTo(game.slingshotX);
                game.currentHero.SetPosition({ x: (mouse.x + game.offsetLeft) / box2d.scale, y: mouse.y / box2d.scale });
            } else {
                game.mode = "fired";
                game.slingshotReleasedSound.play();
                var impulseScaleFactor = 0.75;

                // Coordenadas del centro de la honda (donde la banda está atada a la honda)
                var slingshotCenterX = game.slingshotX + 35;
                var slingshotCenterY = game.slingshotY + 25;
                var impulse = new b2Vec2((slingshotCenterX - mouse.x - game.offsetLeft) * impulseScaleFactor, (slingshotCenterY - mouse.y) * impulseScaleFactor);
                game.currentHero.ApplyImpulse(impulse, game.currentHero.GetWorldCenter());

            }
        }

        if (game.mode == "fired") {
            //Vista panorámica donde el héroe se encuentra actualmente...
            var heroX = game.currentHero.GetPosition().x * box2d.scale;
            game.panTo(heroX);

            //Y esperar hasta que deja de moverse o está fuera de los límites
            if (!game.currentHero.IsAwake() || heroX < 0 || heroX > game.currentLevel.foregroundImage.width) {
                // Luego borra el viejo héroe
                box2d.world.DestroyBody(game.currentHero);
                game.currentHero = undefined;
                // y carga el siguiente héroe
                game.mode = "load-next-hero";
            }
        }


        if (game.mode == "load-next-hero") {
            game.countHeroesAndVillains();

            // Comprobar si algún villano está vivo, si no, termine el nivel (éxito)
            if (game.villains.length == 0) {
                game.mode = "level-success";
                return;
            }

            // Comprobar si hay más héroes para cargar, si no terminar el nivel (fallo)
            if (game.heroes.length == 0) {
                game.mode = "level-failure"
                return;
            }

            // Cargar el héroe y establecer el modo de espera para disparar (wait-for-firing)
            if (!game.currentHero) {
                game.currentHero = game.heroes[game.heroes.length - 1];
                game.currentHero.SetPosition({ x: 180 / box2d.scale, y: 200 / box2d.scale });
                game.currentHero.SetLinearVelocity({ x: 0, y: 0 });
                game.currentHero.SetAngularVelocity(0);
                game.currentHero.SetAwake(true);
            } else {
                // Esperar a que el héroe deje de rebotar y se duerma y luego cambie a espera para disparar (wait-for-firing)
                game.panTo(game.slingshotX);
                if (!game.currentHero.IsAwake()) {
                    game.mode = "wait-for-firing";
                }
            }
        }

        if (game.mode == "level-success" || game.mode == "level-failure") {
            if (game.panTo(0)) {
                game.ended = true;
                game.showEndingScreen();
            }
        }

    },
    showEndingScreen: function () {
        game.stopBackgroundMusic();
        if (game.mode == "level-success") {
            if (game.currentLevel.number < levels.data.length - 1) {
                $('#endingmessage').html('Level Complete. Well Done!!!');
                $("#playnextlevel").show();
            } else {
                $('#endingmessage').html('All Levels Complete. Well Done!!!');
                $("#playnextlevel").hide();
            }
        } else if (game.mode == "level-failure") {
            $('#endingmessage').html('Failed. Play Again?');
            $("#playnextlevel").hide();
        }

        $('#endingscreen').show();
    },

    animate: function () {
        // Animar el fondo
        game.handlePanning();

        // Animar los personajes
        var currentTime = new Date().getTime();
        var timeStep;
        if (game.lastUpdateTime) {
            timeStep = (currentTime - game.lastUpdateTime) / 1000;
            if (timeStep > 2 / 60) {
                timeStep = 2 / 60
            }
            box2d.step(timeStep);
        }
        game.lastUpdateTime = currentTime;


        // Dibujar el fondo con desplazamiento de paralaje
        game.context.drawImage(game.currentLevel.backgroundImage, game.offsetLeft / 4, 0, 640, 480, 0, 0, 640, 480);
        game.context.drawImage(game.currentLevel.foregroundImage, game.offsetLeft, 0, 640, 480, 0, 0, 640, 480);

        // Dibujar la honda
        game.context.drawImage(game.slingshotImage, game.slingshotX - game.offsetLeft, game.slingshotY);

        // Dibujar todos los cuerpos
        game.drawAllBodies();

        // Dibujar la banda cuando estamos disparando un héroe
        if (game.mode == "wait-for-firing" || game.mode == "firing") {
            game.drawSlingshotBand();
        }

        // Dibujar el frente de la honda
        game.context.drawImage(game.slingshotFrontImage, game.slingshotX - game.offsetLeft, game.slingshotY);

        if (!game.ended) {
            game.animationFrame = window.requestAnimationFrame(game.animate, game.canvas);
        }
        /**

        //DIBUJAR HEROES
        // Dibujar HEROES fijos a la derecha
        var heroSpacing = 100; // Espacio entre los heroes
        var totalHeroWidth = 0;

        // Calcular el ancho total de los heroes
        for (var i = 0; i < game.currentLevel.hero.length; i++) {
            totalHeroWidth += game.currentLevel.hero[i].width;
        }

        var heroX = game.canvas.width - totalHeroWidth - (heroSpacing * (game.currentLevel.hero.length - 1)) + 250; // Ajuste para mover más hacia la derecha
        var heroY = 50; // Coordenada Y de los heroes centrada verticalmente en la pantalla

        for (var i = 0; i < game.currentLevel.hero.length; i++) {
            var entity = game.currentLevel.hero[i];
            game.context.drawImage(entity, heroX - game.offsetLeft, heroY);
            heroX += entity.width + heroSpacing; // Ajustar la posición X para el próximo heroes
        }


        //DIBUJAR ENEMIGOS
        // Dibujar enemigos fijos a la derecha
        var enemySpacing = 100; // Espacio entre los enemigos
        var totalEnemyWidth = 0;

        // Calcular el ancho total de los enemigos
        for (var i = 0; i < game.currentLevel.enemy.length; i++) {
            totalEnemyWidth += game.currentLevel.enemy[i].width;
        }

        var enemyX = game.canvas.width - totalEnemyWidth - (enemySpacing * (game.currentLevel.enemy.length - 1)) + 250; // Ajuste para mover más hacia la derecha
        var enemyY = game.canvas.height / 2 - game.currentLevel.enemy[0].height / 2; // Coordenada Y de los enemigos centrada verticalmente en la pantalla

        for (var i = 0; i < game.currentLevel.enemy.length; i++) {
            var entity = game.currentLevel.enemy[i];
            game.context.drawImage(entity, enemyX - game.offsetLeft, enemyY);
            enemyX += entity.width + enemySpacing; // Ajustar la posición X para el próximo enemigo
        }


        //Para cuando se acabe el juego
        if (!game.ended) {
            game.animationFrame = window.requestAnimationFrame(game.animate, game.canvas);
        }*/
    },
    drawAllBodies: function () {
        box2d.world.DrawDebugData();

        // Iterar a través de todos los cuerpos y dibujarlos en el lienzo del juego		  
        for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
            var entity = body.GetUserData();

            if (entity) {
                var entityX = body.GetPosition().x * box2d.scale;
                if (entityX < 0 || entityX > game.currentLevel.foregroundImage.width || (entity.health && entity.health < 0)) {
                    box2d.world.DestroyBody(body);
                    if (entity.type == "villain") {
                        game.score += entity.calories;
                        $('#score').html('Score: ' + game.score);
                    }
                    if (entity.breakSound) {
                        entity.breakSound.play();
                    }
                } else {
                    entities.draw(entity, body.GetPosition(), body.GetAngle())
                }
            }
        }
    },
    drawSlingshotBand: function () {
        game.context.strokeStyle = "rgb(68,31,11)"; // Color marrón oscuro
        game.context.lineWidth = 6; // Dibuja una línea gruesa

        // Utilizar el ángulo y el radio del héroe para calcular el centro del héroe
        var radius = game.currentHero.GetUserData().radius;
        var heroX = game.currentHero.GetPosition().x * box2d.scale;
        var heroY = game.currentHero.GetPosition().y * box2d.scale;
        var angle = Math.atan2(game.slingshotY + 25 - heroY, game.slingshotX + 50 - heroX);

        var heroFarEdgeX = heroX - radius * Math.cos(angle);
        var heroFarEdgeY = heroY - radius * Math.sin(angle);



        game.context.beginPath();
        // Iniciar la línea desde la parte superior de la honda (la parte trasera)
        game.context.moveTo(game.slingshotX + 50 - game.offsetLeft, game.slingshotY + 25);

        // Dibuja línea al centro del héroe
        game.context.lineTo(heroX - game.offsetLeft, heroY);
        game.context.stroke();

        // Dibuja el héroe en la banda posterior
        entities.draw(game.currentHero.GetUserData(), game.currentHero.GetPosition(), game.currentHero.GetAngle());

        game.context.beginPath();
        // Mover al borde del héroe más alejado de la parte superior de la honda
        game.context.moveTo(heroFarEdgeX - game.offsetLeft, heroFarEdgeY);

        // Dibujar línea de regreso a la parte superior de la honda (el lado frontal)
        game.context.lineTo(game.slingshotX - game.offsetLeft + 10, game.slingshotY + 30)
        game.context.stroke();
    },

}


var levels = {
    // Datos del nivel
    data: [
        {// Primer nivel
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities: [
                { type: 'hero', x: 10000, y: 10000, image: 'images/entities/portalgun.png' },
                { type: 'hero', x: 10000, y: 10000, image: 'images/entities/picklerick.png' },
                { type: 'hero', x: 10000, y: 10000, image: 'images/entities/poopybutthole.png' },
                { type: 'hero', x: 10000, y: 10000, image: 'images/entities/plumbus.png' },
                { type: 'hero', x: 10000, y: 10000, image: 'images/entities/meeseeks.png' },
                { type: 'enemy', x: 1000, y: 1000, image: 'images/entities/tammy.png' },
                { type: 'enemy', x: 10000, y: 10000, image: 'images/entities/phoenixperson.png' },
                { type: 'enemy', x: 10000, y: 10000, image: 'images/entities/evilmorty.png' },
                { type: 'enemy', x: 10000, y: 10000, image: 'images/entities/bolognese.png' },
                { type: 'enemy', x: 10000, y: 10000, image: 'images/entities/sunscream.png' },

                { type: 'structure', x: 10000, y: 10000, image: 'images/entities/wood.png' },
                { type: 'structure', x: 10000, y: 10000, image: 'images/entities/glass.png' }
            ]
        },
        { // Segundo nivel
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities: [
                { type: 'hero', x: 10000, y: 10000, image: 'images/entities/portalgun.png' },
                { type: 'hero', x: 10000, y: 10000, image: 'images/entities/picklerick.png' },
                { type: 'hero', x: 10000, y: 10000, image: 'images/entities/poopybutthole.png' },
                { type: 'hero', x: 10000, y: 10000, image: 'images/entities/plumbus.png' },
                { type: 'hero', x: 10000, y: 10000, image: 'images/entities/meeseeks.png' },
                { type: 'enemy', x: 1000, y: 1000, image: 'images/entities/tammy.png' },
                { type: 'enemy', x: 10000, y: 10000, image: 'images/entities/phoenixperson.png' },
                { type: 'enemy', x: 10000, y: 10000, image: 'images/entities/evilmorty.png' },
                { type: 'enemy', x: 10000, y: 10000, image: 'images/entities/bolognese.png' },
                { type: 'enemy', x: 10000, y: 10000, image: 'images/entities/sunscream.png' },

                { type: 'structure', x: 10000, y: 10000, image: 'images/entities/wood.png' },
                { type: 'structure', x: 10000, y: 10000, image: 'images/entities/glass.png' }
            ]
        }
    ],

    // Inicializar pantalla de selección de nivel
    init: function () {
        var html = "";
        for (var i = 0; i < levels.data.length; i++) {
            var level = levels.data[i];
            html += '<input type="button" value="' + (i + 1) + '">';
        };
        $('#levelselectscreen').html(html);

        // Establecer los controladores de eventos de clic de botón para cargar el nivel
        $('#levelselectscreen input').click(function () {
            levels.load(this.value - 1);
            $('#levelselectscreen').hide();
        });
    },

    // Cargar todos los datos e imágenes para un nivel específico
    load: function (number) {
        //Inicializar box2d world cada vez que se carga un nivel
		box2d.init();

        //Declarar un nuevo objeto de nivel actual
        game.currentLevel = { number: number, hero: [], enemy: [] };
        game.score = 0;
        $('#score').html('Score: ' + game.score);
        game.currentHero = 5;
        var level = levels.data[number];


        //Cargar las imágenes de fondo, primer plano y honda
        game.currentLevel.backgroundImage = loader.loadImage("images/backgrounds/background.png");
        game.slingshotImage = loader.loadImage("images/slingshot.png");
        game.slingshotFrontImage = loader.loadImage("images/slingshot-front.png");


        //CARGAR HEORES Y VILLANOS
        //Recorrer la data para tener heores y villanos en el game.currentLevel (nivel que se está jugando)
        var j = 0;
        for (var i = 0; i < level.entities.length; i++) {
            if (level.entities[i].type == "hero") {
                game.currentLevel.hero[j] = loader.loadImage(level.entities[i].image);
                j++;
            }

        }
        j = 0;
        for (var i = 0; i < level.entities.length; i++) {
            if (level.entities[i].type == "enemy") {
                game.currentLevel.enemy[j] = loader.loadImage(level.entities[i].image);
                j++;
            }

        }

        //Llamar a game.start() una vez que todos los assets han sido cargados
        if (loader.loaded) {

            game.start()
        } else {
            loader.onload = game.start;
        }
    }
}

var loader = {
    loaded: true,
    loadedCount: 0, // Assets que se han cargado hasta ahora
    totalCount: 0, // Número total de Assets que deben cargarse

    init: function () {
        // Comprobar si hay soporte de sonido
        var mp3Support, oggSupport;
        var audio = document.createElement('audio');
        if (audio.canPlayType) {
            // Actualmente canPlayType() devuelve: "", "maybe" o "probably" 
            mp3Support = "" != audio.canPlayType('audio/mpeg');
            oggSupport = "" != audio.canPlayType('audio/ogg; codecs="vorbis"');
        } else {
            //La etiqueta de audio no es soportada
            mp3Support = false;
            oggSupport = false;
        }

        // Comprobar para ogg, después mp3, y finalmente fije soundFileExtn a indefinido
        loader.soundFileExtn = oggSupport ? ".ogg" : mp3Support ? ".mp3" : undefined;
    },

    loadImage: function (url) {
        this.totalCount++;
        this.loaded = false;
        $('#loadingscreen').show();
        var image = new Image();
        image.src = url;
        image.onload = loader.itemLoaded;
        return image;
    },
    soundFileExtn: ".ogg",
    loadSound: function (url) {
        this.totalCount++;
        this.loaded = false;
        $('#loadingscreen').show();
        var audio = new Audio();
        audio.src = url + loader.soundFileExtn;
        audio.addEventListener("canplaythrough", loader.itemLoaded, false);
        return audio;
    },
    itemLoaded: function () {
        loader.loadedCount++;
        $('#loadingmessage').html('Loaded ' + loader.loadedCount + ' of ' + loader.totalCount);
        if (loader.loadedCount === loader.totalCount) {
            // Loader has loaded completely..
            loader.loaded = true;
            // Hide the loading screen 
            $('#loadingscreen').hide();
            //Y llamar al método loader.onload si existe
            if (loader.onload) {
                loader.onload();
                loader.onload = undefined;
            }
        }
    }
}

var mouse = {
    x: 0,
    y: 0,
    down: false,
    init: function () {
        $('#gamecanvas').mousemove(mouse.mousemovehandler);
        $('#gamecanvas').mousedown(mouse.mousedownhandler);
        $('#gamecanvas').mouseup(mouse.mouseuphandler);
        $('#gamecanvas').mouseout(mouse.mouseuphandler);
    },
    mousemovehandler: function (ev) {
        var offset = $('#gamecanvas').offset();

        mouse.x = ev.pageX - offset.left;
        mouse.y = ev.pageY - offset.top;

        if (mouse.down) {
            mouse.dragging = true;
        }
    },
    mousedownhandler: function (ev) {
        mouse.down = true;
        mouse.downX = mouse.x;
        mouse.downY = mouse.y;
        ev.originalEvent.preventDefault();

    },
    mouseuphandler: function (ev) {
        mouse.down = false;
        mouse.dragging = false;
    }
}
