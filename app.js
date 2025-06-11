// --- Configurazione del progetto Firebase (invariata) ---
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

// Ottieni un riferimento ai servizi di Storage e Firestore
const storage = firebase.storage();
const firestore = firebase.firestore(); // Ci servirà nel prossimo futuro

// --- Gestione degli elementi del DOM ---
const themeForm = document.getElementById('theme-form');
const themeNameInput = document.getElementById('theme-name');
const themeCategoryInput = document.getElementById('theme-category');
const wallpapersInput = document.getElementById('wallpapers-input');
const ringtonesInput = document.getElementById('ringtones-input');
const notificationsInput = document.getElementById('notifications-input');

const uploadStatus = document.getElementById('upload-status');
const progressBar = document.getElementById('progress-bar');
const submitButton = themeForm.querySelector('button[type="submit"]');


// --- LOGICA PRINCIPALE ---

// Aggiungi un listener per il submit dell'intero form
themeForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impedisce il ricaricamento della pagina
    
    // Disabilita il pulsante per evitare doppi click
    submitButton.disabled = true;
    submitButton.textContent = 'Caricamento in corso...';
    
    const themeName = themeNameInput.value;
    const themeCategory = themeCategoryInput.value;

    if (!themeName || !themeCategory) {
        uploadStatus.textContent = 'Per favore, compila nome e categoria del tema.';
        submitButton.disabled = false;
        submitButton.textContent = 'Crea Tema Completo';
        return;
    }

    // Raccogliamo tutti i file da tutti gli input
    const wallpaperFiles = Array.from(wallpapersInput.files);
    const ringtoneFiles = Array.from(ringtonesInput.files);
    const notificationFiles = Array.from(notificationsInput.files);

    const allFilesToUpload = [
        ...wallpaperFiles.map(file => ({ file, path: 'images' })),
        ...ringtoneFiles.map(file => ({ file, path: 'audio/ringtones' })),
        ...notificationFiles.map(file => ({ file, path: 'audio/notifications' }))
    ];

    if (allFilesToUpload.length === 0) {
        uploadStatus.textContent = 'Per favore, seleziona almeno un file da caricare.';
        submitButton.disabled = false;
        submitButton.textContent = 'Crea Tema Completo';
        return;
    }

    // --- Gestione dell'upload multiplo ---
    const totalFiles = allFilesToUpload.length;
    let uploadedFiles = 0;
    const uploadedFileNames = {
        wallpapers: [],
        ringtones: [],
        notifications: []
    };

    // Usiamo Promise.all per aspettare che tutti gli upload siano finiti
    try {
        const uploadPromises = allFilesToUpload.map(fileObject => {
            return uploadFile(fileObject.file, fileObject.path).then(fileName => {
                uploadedFiles++;
                // Aggiorniamo lo stato
                uploadStatus.textContent = `Caricato file ${uploadedFiles} di ${totalFiles}...`;
                progressBar.style.width = (uploadedFiles / totalFiles) * 100 + '%';
                
                // Salviamo i nomi dei file per il prossimo step
                if (fileObject.path === 'images') {
                    uploadedFileNames.wallpapers.push(fileName);
                } else if (fileObject.path === 'audio/ringtones') {
                    uploadedFileNames.ringtones.push(fileName);
                } else {
                    uploadedFileNames.notifications.push(fileName);
                }
            });
        });

        await Promise.all(uploadPromises);

        // Se arriviamo qui, tutti gli upload sono completati
        uploadStatus.textContent = 'Tutti i file sono stati caricati con successo!';
        console.log("Riepilogo dei file caricati:", uploadedFileNames);
        console.log("Dati del tema:", { name: themeName, category: themeCategory });

        // **PROSSIMO STEP (che implementeremo dopo):**
        // Qui chiameremo la nostra Cloud Function HTTP inviandole i dati del tema
        // e la lista dei nomi dei file (uploadedFileNames).

    } catch (error) {
        console.error("Si è verificato un errore durante l'upload:", error);
        uploadStatus.textContent = `Errore: ${error.message}`;
        progressBar.style.backgroundColor = 'red';
    } finally {
        // Riabilita il pulsante alla fine del processo
        submitButton.disabled = false;
        submitButton.textContent = 'Crea Tema Completo';
    }
});


// Funzione helper che gestisce l'upload di un singolo file e restituisce una Promise
function uploadFile(file, path) {
    return new Promise((resolve, reject) => {
        const storageRef = storage.ref(`${path}/${file.name}`);
        const uploadTask = storageRef.put(file);

        uploadTask.on('state_changed',
            null, // Non gestiamo il progresso qui, ma nel "then" della promise
            (error) => {
                // Errore
                reject(error);
            },
            () => {
                // Successo
                // Restituiamo il nome del file originale per il nostro riepilogo
                resolve(file.name);
            }
        );
    });
}