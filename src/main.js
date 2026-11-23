// Chamada em body.onload: Inicialização automática quando a página for carregada

let game = null;
function init() {
    game = new Game();
    if (game) {
        game.start();
    }
}