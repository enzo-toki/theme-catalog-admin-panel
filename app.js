// --- Inserisci qui la configurazione del tuo progetto Firebase ---
// L'ho presa dal tuo file `firebase_options.dart`
const firebaseConfig = {
    apiKey: "AIzaSyBb-bYx5v6v2-kvzbHKlfCcuKoKu8MNWVE",
    authDomain: "theme-catalog-app.firebaseapp.com",
    projectId: "theme-catalog-app",
    storageBucket: "theme-catalog-app.firebasestorage.app",
    messagingSenderId: "881141808927",
    appId: "1:881141808927:web:a43f7db256173fc31b7a2a"
};

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);

// Ottieni un riferimento al servizio di Storage
const storage = firebase.storage();

// Gestisci gli elementi del DOM
const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');
const progressBar = document.getElementById('progress-bar');

// Aggiungi un listener per il submit del form
uploadForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Impedisce il ricaricamento della pagina

    const file = fileInput.files[0];
    if (!file) {
        uploadStatus.textContent = 'Per favore, seleziona un file.';
        return;
    }

    // Crea un percorso su Cloud Storage. Esempio: 'uploads/nomefile.jpg'
    // Separiamo per tipo per attivare le funzioni giuste
    const fileType = file.type.startsWith('image/') ? 'images' : 'audio';
    const storageRef = storage.ref(`${fileType}/${file.name}`);

    // Avvia l'upload del file
    const uploadTask = storageRef.put(file);

    // Monitora lo stato dell'upload
    uploadTask.on('state_changed',
        (snapshot) => {
            // Aggiornamento del progresso
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressBar.style.width = progress + '%';
            uploadStatus.textContent = `Caricamento... ${Math.round(progress)}%`;
        },
        (error) => {
            // Gestione dell'errore
            console.error("Errore durante l'upload:", error);
            uploadStatus.textContent = `Errore: ${error.message}`;
            progressBar.style.backgroundColor = 'red';
        },
        () => {
            // Upload completato con successo
            uploadStatus.textContent = 'Upload completato con successo!';
            progressBar.style.backgroundColor = '#4caf50';

            // Ottieni l'URL di download
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                console.log('File disponibile a:', downloadURL);
            });
        }
    );
});
