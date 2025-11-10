const socket = io();

const inputNome = document.getElementById('nome');
const selectSlot = document.getElementById('slot');
const btnConferma = document.getElementById('btnConferma');
const btnX = document.getElementById('btnX');
const btnVAI = document.getElementById('btnVAI');
const btnResetNome = document.getElementById('btnResetNome');
const setup = document.getElementById('setup');
const pulsanti = document.getElementById('pulsanti');

let nome = '';
let slot = '1';

// Conferma nome e slot
btnConferma.addEventListener('click', () => {
  const nomeValido = inputNome.value.trim();
  const slotValido = selectSlot.value;

  if (!nomeValido) {
    alert('Inserisci il tuo nome');
    return;
  }

  nome = nomeValido;
  slot = slotValido;
  document.getElementById('nomeGiudice').textContent = `– ${nome}`;

  setup.style.display = 'none';
  pulsanti.style.display = 'flex';
});

// Invia scelta ❌
btnX.addEventListener('click', () => {
  if (nome && slot) {
    socket.emit('scelta', { slot: parseInt(slot), nome, scelta: 'X' });
  }
});

// Invia scelta ✅
btnVAI.addEventListener('click', () => {
  if (nome && slot) {
    socket.emit('scelta', { slot: parseInt(slot), nome, scelta: 'VAI' });
  }
});

// Riassegna nome
btnResetNome.addEventListener('click', () => {
  nome = '';
  slot = '1';
  inputNome.value = '';
  selectSlot.value = '1';
  setup.style.display = 'flex';
  pulsanti.style.display = 'none';
});