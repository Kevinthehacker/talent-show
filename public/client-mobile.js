const socket = io();

// Elementi DOM (Assicurati che corrispondano all'HTML)
const inputNome = document.getElementById('nome');
const selectSlot = document.getElementById('slot');
const btnConferma = document.getElementById('btnConferma');
const btnX = document.getElementById('btnX');
const btnResetNome = document.getElementById('btnResetNome');
const setup = document.getElementById('setup');
const pulsanti = document.getElementById('pulsanti');
const nomeGiudiceLabel = document.getElementById('nomeGiudice');
const nomeConcorrenteLabel = document.getElementById('nome-concorrente');
const overlay = document.getElementById('feedback-overlay'); // Per l'effetto voto inviato
const fbIcon = document.getElementById('fb-icon');

let nome = '';
let slot = '1';

// --- 1. RICEZIONE DATI DALLA REGIA ---

// Aggiorna il nome del cantante in tempo reale
socket.on('cambia-nome', (nomeCantante) => {
    if (nomeConcorrenteLabel) {
        nomeConcorrenteLabel.textContent = nomeCantante;
    }
    // Se cambia il cantante, nascondi l'overlay del voto precedente
    if(overlay) overlay.style.display = 'none';
});

// Reset Voti (Nuovo Concorrente)
socket.on('aggiorna', (stato) => {
    // Se il mio slot è stato resettato (voto tornato a null), mi preparo a votare di nuovo
    if (slot && stato[slot] && stato[slot].scelta === null) {
        if(overlay) overlay.style.display = 'none';
    }
});

// Logout Forzato (Reset Totale)
socket.on('logout', () => {
    location.reload(); 
});


// --- 2. GESTIONE UTENTE ---

// LOGIN: Conferma nome e slot
btnConferma.addEventListener('click', () => {
    const nomeValido = inputNome.value.trim();
    const slotValido = selectSlot.value;

    if (!nomeValido) {
        alert('Inserisci il tuo nome');
        return;
    }

    nome = nomeValido;
    slot = parseInt(slotValido);

    // AGGIORNAMENTO: Invia subito il login al server
    socket.emit('login', { slot: slot, nome: nome });

    // Aggiorna UI
    if(nomeGiudiceLabel) nomeGiudiceLabel.textContent = ` ${nome}`;
    setup.style.display = 'none';
    pulsanti.style.display = 'flex';
});

// LOGOUT: Riassegna nome
btnResetNome.addEventListener('click', () => {
    location.reload(); // Il modo più pulito per resettare tutto
});


// --- 3. INVIO VOTI ---

function inviaVoto(scelta) {
    if (nome && slot) {
        // Invia al server (compatibile con server.js Ultimate)
        socket.emit('voto', { slot: slot, scelta: scelta });
        
        // Mostra Feedback visivo (Se presente nell'HTML)
        if (overlay && fbIcon) {
            fbIcon.textContent = scelta === 'X' ? '❌' : '⭐';
            overlay.style.display = 'flex';
        }
    }
}

// Click su X
btnX.addEventListener('click', () => inviaVoto('X'));

