// All user-facing copy (pt-BR). See docs/adr/0001-ptbr-ui-english-code.md.

export const t = Object.freeze({
  appName: 'Rotation Timer',

  // Setup
  setupTitle: 'Jogadores',
  playerNamePlaceholder: 'Nome do jogador',
  addPlayer: 'Adicionar',
  removePlayer: (name) => `Remover ${name}`,
  moveUp: (name) => `Subir ${name}`,
  moveDown: (name) => `Descer ${name}`,
  shuffle: 'Embaralhar',
  startGame: 'Iniciar jogo',
  minPlayersHint: (min) => `Adicione pelo menos ${min} jogadores`,
  firstPlayerHint: 'O primeiro da lista começa',
  errors: {
    empty: 'Digite um nome',
    duplicate: 'Esse nome já está na lista',
    full: 'Lista cheia',
  },

  // Settings
  settings: 'Configurações',
  startingBank: 'Tempo de cada jogador',
  refill: 'Tempo ao estourar',
  refillHint: 'Quem zerar o tempo perde a vez e recebe esse tempo',
  endOnFirstWin: 'Acabar no primeiro vencedor',
  allowOutOfTurnWins: 'Permitir vitória fora da vez',
  sound: 'Sons',
  decrease: (label) => `Diminuir ${label}`,
  increase: (label) => `Aumentar ${label}`,
  back: 'Voltar',

  // Game
  rotationLabel: 'Ordem dos jogadores',
  yourTurn: 'Sua vez',
  start: 'Iniciar',
  endTurn: 'Finalizar',
  iWon: 'Ganhei',
  pause: 'Pausar',
  outOfTurnWin: 'Alguém ganhou',
  timeout: 'Tempo esgotado!',
  undo: 'Desfazer',
  turnEnded: (name) => `Vez de ${name} finalizada`,

  // Modals
  paused: 'Pausado',
  resume: 'Continuar',
  endGame: 'Encerrar jogo',
  endGameConfirm: 'Encerrar o jogo agora?',
  yes: 'Sim',
  no: 'Não',
  cancel: 'Cancelar',
  winConfirm: (name) => `${name} ganhou?`,
  whoWon: 'Quem ganhou?',
  wonBanner: (name) => `${name} venceu!`,

  // Standings
  standingsTitle: 'Resultado',
  place: (n) => `${n}º`,
  didNotFinish: 'não terminou',
  playAgain: 'Jogar de novo',
  backToSetup: 'Voltar',
});
