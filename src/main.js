// Chamada em body.onload: Inicialização automática quando a página for carregada

function init() {
    Game.create()
        .then((game) => {
            if (game) game.start();
            else console.warn(`Game was not able to start: ${game}`)
        })
        .catch(console.error);
}