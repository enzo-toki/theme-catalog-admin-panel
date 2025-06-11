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
const storage = firebase.storage();
const firestore = firebase.firestore();

// --- Elementi del DOM ---
const themeForm = document.getElementById('theme-form');
const themeNameInput = document.getElementById('theme-name');
const themeCategoryInput = document.getElementById('theme-category');
const wallpapersInput = document.getElementById('wallpapers-input');
const ringtonesInput = document.getElementById('ringtones-input');
const notificationsInput = document.getElementById('notifications-input');
const uploadStatus = document.getElementById('upload-status');
const progressBar = document.getElementById('progress-bar');
const submitButton = themeForm.querySelector('button[type="submit"]');

// --- Funzione Helper per l'attesa ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- LOGICA PRINCIPALE ---
themeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = 'Caricamento file...';
    
    try {
        // --- 1. UPLOAD DI TUTTI I FILE ---
        const allFilesToUpload = [
            ...Array.from(wallpapersInput.files).map(file => ({ file, path: 'images' })),
            ...Array.from(ringtonesInput.files).map(file => ({ file, path: 'audio/ringtones' })),
            ...Array.from(notificationsInput.files).map(file => ({ file, path: 'audio/notifications' }))
        ];

        if (allFilesToUpload.length === 0) throw new Error("Seleziona almeno un file.");
        
        const uploadPromises = allFilesToUpload.map(fo => storage.ref(`${fo.path}/${fo.file.name}`).put(fo.file));
        await Promise.all(uploadPromises);
        uploadStatus.textContent = 'File caricati. In attesa dell\'elaborazione delle immagini...';
        progressBar.style.width = '50%';
        
        // --- 2. PREPARAZIONE DATI PER FIRESTORE ---
        // Attende che l'estensione crei i file e poi recupera gli URL
        
        const wallpapers = await Promise.all(Array.from(wallpapersInput.files).map(getWallpaperAsset));
        const callRingtones = await Promise.all(Array.from(ringtonesInput.files).map(file => getAudioAsset(file, 'ringtones')));
        const notificationSounds = await Promise.all(Array.from(notificationsInput.files).map(file => getAudioAsset(file, 'notifications')));

        // --- 3. CREAZIONE DEL DOCUMENTO ---
        uploadStatus.textContent = 'Creazione del tema su Firestore...';
        
        const themeDocument = {
            name: themeNameInput.value,
            category: themeCategoryInput.value,
            wallpapers,
            callRingtones,
            notificationSounds,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await firestore.collection("themes").add(themeDocument);
        
        progressBar.style.width = '100%';
        uploadStatus.textContent = `TEMA CREATO CON SUCCESSO! ID: ${docRef.id}`;
        console.log("Documento creato:", themeDocument);

    } catch (error) {
        console.error("ERRORE FINALE:", error);
        uploadStatus.textContent = `Errore: ${error.message}`;
        progressBar.style.backgroundColor = 'red';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Crea Tema Completo';
    }
});

// Funzione che attende la creazione delle immagini ridimensionate e ne recupera gli URL
async function getWallpaperAsset(originalFile) {
    const baseName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.'));
    const resizedPaths = {
        fullUrl: `images/${baseName}_1080x1920.webp`,
        mediumUrl: `images/${baseName}_800x1280.webp`,
        thumbnailUrl: `images/${baseName}_300x300.webp`,
    };

    const asset = {};
    // Prova a recuperare gli URL per un massimo di 30 secondi
    for (const key in resizedPaths) {
        const path = resizedPaths[key];
        let urlFound = false;
        for (let i = 0; i < 15; i++) { // 15 tentativi x 2 secondi = 30 secondi
            try {
                asset[key] = await storage.ref(path).getDownloadURL();
                console.log(`URL trovato per ${path}`);
                urlFound = true;
                break;
            } catch (e) {
                console.log(`In attesa di ${path}... (tentativo ${i + 1})`);
                await sleep(2000); // Aspetta 2 secondi
            }
        }
        if (!urlFound) throw new Error(`Timeout: impossibile trovare l'immagine processata ${path}`);
    }
    return asset;
}

// Funzione che recupera l'URL di un file audio
async function getAudioAsset(file, type) {
    const path = `audio/${type}/${file.name}`;
    const url = await storage.ref(path).getDownloadURL();
    return {
        name: file.name.substring(0, file.name.lastIndexOf('.')).replace(/[_-]/g, ' '),
        url: url
    };
}