$(window).load(function() {
    game.init();
});

var game = {
   // Comenzar inicialización de objetos, precarga de elementos y pantalla de inicio
    init: function(){

        // Inicializar objetos   
        levels.init();
        loader.init();
        
        // Ocultar todas las capas del juego y mostrar la pantalla de inicio
        $('.gamelayer').hide();
        $('#gamestartscreen').show();
        
        //Obtener manejador para el canvas del juego y el contexto
        game.canvas = $('#gamecanvas')[0];
        game.context = game.canvas.getContext('2d');
    },

    showLevelScreen:function(){
        $('.gamelayer').hide();
        $('#levelselectscreen').show('slow');
    },
}

var levels = {
    // Datos del nivel
    data:[
     {// Primer nivel
        foreground:'desert-foreground',
        background:'clouds-background',
        entities:[]
     },
        { // Segundo nivel
        foreground:'desert-foreground',
        background:'clouds-background',
        entities:[]
        }
    ],

    // Inicializar pantalla de selección de nivel
    init:function(){
        var html = "";
        for (var i=0; i < levels.data.length; i++) {
            var level = levels.data[i];
            html += '<input type="button" value="'+(i+1)+'">';
        };
        $('#levelselectscreen').html(html);
        
        // Establecer los controladores de eventos de clic de botón para cargar el nivel
        $('#levelselectscreen input').click(function(){
            levels.load(this.value-1);
            $('#levelselectscreen').hide();
        });
    },
    // Cargar todos los datos e imágenes para un nivel específico
    load:function(number){
    }
}

var loader = {
    loaded:true,
    loadedCount:0, // Assets que se han cargado hasta ahora
    totalCount:0, // Número total de Assets que deben cargarse
    
    init:function(){
        // Comprobar si hay soporte de sonido
        var mp3Support,oggSupport;
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
        loader.soundFileExtn = oggSupport?".ogg":mp3Support?".mp3":undefined;        
    },
    
    loadImage:function(url){
        this.totalCount++;
        this.loaded = false;
        $('#loadingscreen').show();
        var image = new Image();
        image.src = url;
        image.onload = loader.itemLoaded;
        return image;
    },
    soundFileExtn:".ogg",
    loadSound:function(url){
        this.totalCount++;
        this.loaded = false;
        $('#loadingscreen').show();
        var audio = new Audio();
        audio.src = url+loader.soundFileExtn;
        audio.addEventListener("canplaythrough", loader.itemLoaded, false);
        return audio;   
    },
    itemLoaded:function(){
        loader.loadedCount++;
        $('#loadingmessage').html('Loaded '+loader.loadedCount+' of '+loader.totalCount);
        if (loader.loadedCount === loader.totalCount){
            // Loader has loaded completely..
            loader.loaded = true;
            // Hide the loading screen 
            $('#loadingscreen').hide();
            //Y llamar al método loader.onload si existe
            if(loader.onload){
                loader.onload();
                loader.onload = undefined;
            }
        }
    }
}


