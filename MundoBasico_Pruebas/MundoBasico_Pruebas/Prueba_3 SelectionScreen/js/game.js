$(window).load(function() {
	game.init();
});

var game = {
   // Comenzar inicialización de objetos, precarga de elementos y pantalla de inicio
    init: function(){

        // Inicializar objetos   
        levels.init();
        
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
        {   // Segundo nivel
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