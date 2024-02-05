$(window).load(function() {
	game.init();
});

var game = {
   // Comenzar inicialización de objetos, precarga de elementos y pantalla de inicio
    init: function(){
        
        // Ocultar todas las capas del juego y mostrar la pantalla de inicio
        $('.gamelayer').hide();
        $('#gamestartscreen').show();
        
        //Obtener manejador para el canvas del juego y el contexto
        game.canvas = $('#gamecanvas')[0];
        game.context = game.canvas.getContext('2d');
    }, 
}