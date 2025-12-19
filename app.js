// Formatage auto pour le champ Distance
function formatDistance(input) {
    let value = input.value.replace(/[^\d.]/g, '');
    if (value) {
        input.value = parseFloat(value).toFixed(1);
    }
}

// Formatage auto pour le champ Temps
function formatDuration(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length === 6) {
        input.value = value.slice(0, 2) + ':' + value.slice(2, 4) + ':' + value.slice(4);
    }
}

// Données du workout + derniers inputs
let workoutData = [];
let lastExercise = '';
const STORAGE_KEY = 'workoutData';
const SESSION_KEY = 'workoutSession';

function addSet() {
    const exercise = document.getElementById('exercise').value.trim();
    const setNum = document.getElementById('setNum').value || '';
    const reps = document.getElementById('reps').value || '';
    const weight = document.getElementById('weight').value || '';
    const steps = document.getElementById('steps').value || '';
    const distance = document.getElementById('distance').value || '';
    const kcal = document.getElementById('kcal').value || '';
    const duration = document.getElementById('duration').value || '';
    const avgHr = document.getElementById('avgHr').value || '';
    const maxHr = document.getElementById('maxHr').value || '';
    const notes = document.getElementById('notes').value || '';

    if (!exercise) {
        alert('Veuillez saisir un exercice.');
        return;
    }

    const set = {
        exercise,
        set: setNum,
        reps,
        weight,
        steps,
        distance,
        kcal,
        duration,
        avgHr,
        maxHr,
        notes
    };

    workoutData.push(set);

    // Afficher dans le tableau
    const tbody = document.getElementById('logTable');
    const row = `<tr><td>${exercise}</td><td>${setNum}</td><td>${reps}</td><td>${weight}</td><td>${steps}</td><td>${distance}</td><td>${kcal}</td><td>${duration}</td><td>${avgHr}</td><td>${maxHr}</td><td>${notes}</td></tr>`;
    tbody.innerHTML += row;

    // Auto-incrément de la série si même exercice
    if (exercise === lastExercise && setNum) {
        document.getElementById('setNum').value = Number(setNum) + 1;
    } else {
        document.getElementById('setNum').value = 1;
    }
    lastExercise = exercise;

    // Effacer les champs (sauf exercice et série)
    document.getElementById('reps').value = '';
    document.getElementById('weight').value = '';
    document.getElementById('steps').value = '';
    document.getElementById('distance').value = '';
    document.getElementById('kcal').value = '';
    document.getElementById('duration').value = '';
    document.getElementById('avgHr').value = '';
    document.getElementById('maxHr').value = '';
    document.getElementById('notes').value = '';

    // Sauvegarder dans LocalStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workoutData));

    // Sauvegarder aussi la session
    const session = {
        name: document.getElementById('sessionName').value,
        date: document.getElementById('dateInput').value,
        time: document.getElementById('timeInput').value,
        lastExercise: lastExercise,
        setNum: document.getElementById('setNum').value
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    showStatus('✅ Série ajoutée');
}

function showStatus(message) {
    const status = document.getElementById('statusMsg');
    status.textContent = message;
    status.style.display = 'block';
    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
}

async function saveLog() {
    const sessionName = document.getElementById('sessionName').value.trim() || 'Session';
    const sessionDate = document.getElementById('dateInput').value || 'NoDate';
    const sessionTime = document.getElementById('timeInput').value || 'NoTime';

    if (workoutData.length === 0) {
        alert('Aucune donnée à sauvegarder.');
        return;
    }

    const formattedDate = sessionDate.replace(/-/g, '');
    const formattedTime = sessionTime.replace(/:/g, '');
    const fileName = `${formattedDate}_${formattedTime}_${sessionName}.json`;

    const output = {
        session: sessionName,
        date: sessionDate,
        time: sessionTime,
        exercises: workoutData
    };

    const jsonContent = JSON.stringify(output, null, 2);

    const file = new File([jsonContent], fileName, { type: "application/json" });

    // API de partage native
    if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'Mon Workout Log',
                text: 'Voici mon fichier de workout.',
            });
            // Si le partage réussit, nettoyer LocalStorage
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(SESSION_KEY);
            showStatus('✅ Fichier partagé et data effacée');
        } catch (error) {
            console.log('Erreur partage:', error);
        }
    } else {
        // Fallback PC (Téléchargement classique)
        const link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Nettoyer après téléchargement
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SESSION_KEY);
        alert("Fichier téléchargé ! (Sur mobile, utilise Chrome pour l'option Drive)");
    }
}

function clearWorkout() {
    if (!confirm('Effacer toutes les données de cette séance ?')) return;

    workoutData = [];
    lastExercise = '';
    document.getElementById('logTable').innerHTML = '';
    document.getElementById('setNum').value = 1;

    // Nettoyer LocalStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);

    showStatus('🗑️ Séance effacée');
}

function loadFromStorage() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedSession = localStorage.getItem(SESSION_KEY);

    if (savedData) {
        workoutData = JSON.parse(savedData);
        const tbody = document.getElementById('logTable');
        tbody.innerHTML = '';
        workoutData.forEach(item => {
            const row = `<tr><td>${item.exercise}</td><td>${item.set}</td><td>${item.reps}</td><td>${item.weight}</td><td>${item.steps || ''}</td><td>${item.distance || ''}</td><td>${item.kcal || ''}</td><td>${item.duration || ''}</td><td>${item.avgHr || ''}</td><td>${item.maxHr || ''}</td><td>${item.notes || ''}</td></tr>`;
            tbody.innerHTML += row;
        });
        showStatus('✅ Données restaurées depuis LocalStorage');
    }

    if (savedSession) {
        const session = JSON.parse(savedSession);
        document.getElementById('sessionName').value = session.name || '';
        document.getElementById('dateInput').value = session.date || '';
        document.getElementById('timeInput').value = session.time || '';
        if (session.lastExercise) {
            document.getElementById('exercise').value = session.lastExercise;
            lastExercise = session.lastExercise;
        }
        if (session.setNum) {
            document.getElementById('setNum').value = session.setNum;
        }
    }
}

// Charger les données au démarrage
loadFromStorage();

// Initialiser Date et Heure avec les valeurs actuelles
function initializeDateTime() {
    const dateInput = document.getElementById('dateInput');
    const timeInput = document.getElementById('timeInput');

    // Si pas de valeur sauvegardée, utiliser maintenant
    if (!dateInput.value) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    }

    if (!timeInput.value) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
    }
}

initializeDateTime();

// --- LOGIQUE AUTOCOMPLETE ---
const exerciseInput = document.getElementById('exercise');
const autocompleteList = document.getElementById('autocomplete-list');

// Ordre d'affichage des catégories
const CATEGORY_ORDER = [
    "Favoris",
    "Sports Extérieurs",
    "Fitness & Musculation",
    "Endurance Musculaire",
    "Hypertrophie",
    "Force Maximale",
    "Puissance",
    "Technique",
    "Conditionnement Cardiovasculaire",
    "Autres"
];

exerciseInput.addEventListener('input', function () {
    const val = this.value;
    // Si vide, on affiche tout (comportement "focus")
    if (!val) {
        renderList(null); // null = tout afficher
        return;
    }
    renderList(val);
});

// Afficher toute la liste au focus
exerciseInput.addEventListener('focus', function () {
    autocompleteList.style.display = 'block';
    // Si le champ est vide, on affiche tout. Sinon on filtre avec la valeur actuelle.
    renderList(this.value || null);
});

function renderList(filterVal) {
    autocompleteList.innerHTML = '';
    let hasResults = false;

    const allCategories = [...new Set([...CATEGORY_ORDER, ...Object.keys(EXERCISE_DATA)])];

    allCategories.forEach(category => {
        if (!EXERCISE_DATA[category]) return;

        let matches = [];

        // Cas 1: Pas de filtre (affichage complet)
        if (!filterVal) {
            matches = EXERCISE_DATA[category];
        }
        // Cas 2: Recherche par NOM de catégorie (ex: "Favoris")
        else if (category.toLowerCase().includes(filterVal.toLowerCase())) {
            matches = EXERCISE_DATA[category];
        }
        // Cas 3: Recherche par NOM d'exercice
        else {
            matches = EXERCISE_DATA[category].filter(exo =>
                exo.toLowerCase().includes(filterVal.toLowerCase())
            );
        }

        if (matches.length > 0) {
            hasResults = true;

            // Header de catégorie
            const header = document.createElement('div');
            header.className = 'category-header';
            header.textContent = category;
            autocompleteList.appendChild(header);

            // Items
            matches.forEach(match => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';

                if (filterVal) {
                    // Mettre en gras la partie correspondante
                    const regex = new RegExp(`(${filterVal})`, "gi");
                    item.innerHTML = match.replace(regex, "<strong>$1</strong>");
                } else {
                    item.textContent = match;
                }

                item.innerHTML += `<input type='hidden' value='${match}'>`;

                item.addEventListener('click', function () {
                    exerciseInput.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                });

                autocompleteList.appendChild(item);
            });
        }
    });

    if (hasResults) {
        autocompleteList.style.display = 'block';
    } else {
        autocompleteList.style.display = 'none';
    }
}

function closeAllLists(elmnt) {
    if (elmnt != exerciseInput) {
        autocompleteList.innerHTML = '';
        autocompleteList.style.display = 'none';
    }
}

// Fermer si on clique ailleurs
document.addEventListener("click", function (e) {
    if (e.target !== exerciseInput && e.target !== autocompleteList) {
        closeAllLists(e.target);
    }
});

// --- EXERCISE INFORMATION & TIMER FUNCTIONALITY ---

// Find exercise details by name
function findExerciseDetails(exerciseName) {
    return EXERCISE_DETAILS.find(ex => ex.Exercice === exerciseName);
}

// Format text with line breaks at each sentence
function formatTextWithLineBreaks(text) {
    if (!text) return 'N/A';
    // Remplacer les fins de phrase (. ! ?) par des sauts de ligne HTML
    // Cette regex améliorée gère les apostrophes de fin de citation.
    let formattedText = text.replace(/([.!?])(’|'|‘|’)?(\s*)/g, '$1$2<br>');
    // Remplacer les sauts de ligne explicites (\n et \\n) par des sauts de ligne HTML
    formattedText = formattedText.replace(/\\n/g, '<br>'); // Gère le cas '\\n'
    formattedText = formattedText.replace(/\n/g, '<br>');  // Gère le cas '\n'

    // Nettoyage esthétique : supprime les apostrophes seules en début de ligne après un <br>
    // et harmonise les apostrophes pour éviter les doublons.
    return formattedText.replace(/<br>\s*’\s*‘/g, '<br>‘');
}

// Display exercise information
function displayExerciseInfo(exerciseData) {
    const infoContent = document.getElementById('info-content');
    const infoSection = document.getElementById('exercise-information');

    if (!exerciseData) {
        infoSection.style.display = 'none';
        return;
    }

    infoContent.innerHTML = `
        <p><strong>📝 Description:</strong><br>${formatTextWithLineBreaks(exerciseData.Description)}</p>
        <p><strong>🛠️ Équipement:</strong> ${exerciseData.Equipement || 'N/A'}</p>
        <p><strong>📊 Difficulté:</strong> ${exerciseData.Notation_Difficulte || 'N/A'}/5 | <strong>Efficacité:</strong> ${exerciseData.Notation_Efficacite || 'N/A'}/5</p>
        ${exerciseData.Variantes ? `<p><strong>🔄 Variantes:</strong><br>${formatTextWithLineBreaks(exerciseData.Variantes)}</p>` : ''}
        ${exerciseData.Conseils_Expert ? `<p><strong>💡 Conseils:</strong><br>${formatTextWithLineBreaks(exerciseData.Conseils_Expert)}</p>` : ''}
        ${exerciseData.LitRPG_Narration ? `<p><strong>⚔️ Narration:</strong><br><em>${formatTextWithLineBreaks(exerciseData.LitRPG_Narration)}</em></p>` : ''}
    `;
    infoSection.style.display = 'block';
}

// Initialize timer with exercise times
function initializeTimer(exerciseData) {
    const timerSection = document.getElementById('exercise-timer');

    if (!exerciseData) {
        timerSection.style.display = 'none';
        return;
    }

    const prepTime = parseInt(exerciseData.Prep_Time) || 0;
    const effortTime = parseInt(exerciseData.Effort_Time) || 0;
    const restTime = parseInt(exerciseData.Rest_Time) || 0;
    const endTime = parseInt(exerciseData.End_Time) || 0;

    document.querySelector('#prep-timer span').textContent = prepTime;
    document.querySelector('#effort-timer span').textContent = effortTime;
    document.querySelector('#rest-timer span').textContent = restTime;
    document.querySelector('#end-timer span').textContent = endTime;

    timerSection.style.display = 'block';

    // Store times for timer functionality
    window.timerPhases = {
        prep: prepTime,
        effort: effortTime,
        rest: restTime,
        end: endTime
    };

    // Reset timer state
    resetTimer();
}

// --- SOUND MANAGER LOGIC ---

function getSoundPath(filename) {
    if (!filename) return '';
    // Files are now stored as "Folder/File.mp3" in the manifest
    return `sounds/${filename}`;
}

let currentAmbientAudio = null;

function initSoundThemes() {
    const selector = document.getElementById('sound-theme');
    if (!selector || typeof SOUND_MANIFEST === 'undefined') return;

    // Clear existing options except Random
    selector.innerHTML = '<option value="random">🎲 Aléatoire</option>';

    // Add themes from manifest
    for (const [id, name] of Object.entries(SOUND_MANIFEST.themes)) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `🎵 ${name}`;
        selector.appendChild(option);
    }
}

// Initialize Ambient Selector
function initAmbientSelector() {
    const selector = document.getElementById('ambient-music');
    if (!selector || typeof SOUND_MANIFEST === 'undefined' || !SOUND_MANIFEST.ambient) return;

    // Add ambient files from manifest
    if (Array.isArray(SOUND_MANIFEST.ambient)) {
        SOUND_MANIFEST.ambient.forEach(file => {
            const option = document.createElement('option');
            option.value = file;
            // Show only filename in label
            const label = file.includes('/') ? file.split('/').pop() : file;
            option.textContent = `🎵 ${label.replace('.mp3', '')}`;
            selector.appendChild(option);
        });
    }
}

// Call initialization when DOM is ready
if (typeof SOUND_MANIFEST !== 'undefined') {
    initSoundThemes();
    initAmbientSelector();
}

// Play Ambient Sound
function playAmbient() {
    const ambientSelector = document.getElementById('ambient-music');
    const selectedAmbient = ambientSelector ? ambientSelector.value : 'none';

    if (selectedAmbient === 'none') {
        stopAmbient();
        return;
    }

    if (typeof SOUND_MANIFEST === 'undefined' || !SOUND_MANIFEST.ambient) return;

    // Stop existing ambient if any
    stopAmbient();

    let ambientFile = '';

    if (selectedAmbient === 'random') {
        // Handle array of ambient sounds (random pick)
        if (Array.isArray(SOUND_MANIFEST.ambient)) {
            if (SOUND_MANIFEST.ambient.length === 0) return;
            const randomIndex = Math.floor(Math.random() * SOUND_MANIFEST.ambient.length);
            ambientFile = getSoundPath(SOUND_MANIFEST.ambient[randomIndex]);
        } else {
            // Legacy string support
            ambientFile = getSoundPath(SOUND_MANIFEST.ambient);
        }
    } else {
        // Specific file selected
        ambientFile = getSoundPath(selectedAmbient);
    }

    currentAmbientAudio = new Audio(ambientFile);
    currentAmbientAudio.loop = true;
    currentAmbientAudio.volume = volumeSlider.value;

    currentAmbientAudio.play().catch(err => {
        console.log('Impossible de jouer l\'ambiance:', err);
    });
}

function stopAmbient() {
    if (currentAmbientAudio) {
        currentAmbientAudio.pause();
        currentAmbientAudio.currentTime = 0;
        currentAmbientAudio = null;
    }
}

// Update ambient immediately if changed during timer
document.getElementById('ambient-music')?.addEventListener('change', function () {
    if (timerInterval) {
        playAmbient();
    }
});

// Get sound file for phase based on theme
function getPhaseSoundFile(phaseName) {
    if (typeof SOUND_MANIFEST === 'undefined') {
        console.log('⚠️ SOUND_MANIFEST not loaded');
        return null;
    }

    const themeSelector = document.getElementById('sound-theme');
    const selectedTheme = themeSelector ? themeSelector.value : 'random';

    console.log(`🔊 getPhaseSoundFile: phase="${phaseName}", theme="${selectedTheme}"`);

    // Folder names in manifest are capitalized: Prep, Effort, Rest, End
    const phaseFolder = phaseName.charAt(0).toUpperCase() + phaseName.slice(1);

    // Look for files in the specific folder
    let eligibleFiles = SOUND_MANIFEST.files.filter(f => f.startsWith(`${phaseFolder}/`));
    console.log(`🔊 Files in folder "${phaseFolder}/":`, eligibleFiles);

    if (selectedTheme !== 'random') {
        // Filter by theme ID (e.g., _01)
        eligibleFiles = eligibleFiles.filter(f => f.includes(`_${selectedTheme}`));
        console.log(`🔊 After theme filter (_${selectedTheme}):`, eligibleFiles);
    }

    if (eligibleFiles.length === 0) {
        console.log('⚠️ No eligible sound files found');
        return null;
    }

    // Pick random file from eligible list
    const randomFile = eligibleFiles[Math.floor(Math.random() * eligibleFiles.length)];
    const fullPath = getSoundPath(randomFile);
    console.log(`✅ Selected sound: ${fullPath}`);
    return fullPath;
}

// Play sound for current phase
function playPhaseSound(phaseName) {
    console.log(`🎵 playPhaseSound called for: ${phaseName}`);

    const soundFile = getPhaseSoundFile(phaseName);
    if (soundFile) {
        console.log(`🎵 Playing sound: ${soundFile}`);
        try {
            const audio = new Audio(soundFile);
            audio.play().catch(err => console.log('Erreur audio:', err));
        } catch (error) {
            console.log('Erreur audio:', error);
        }
    } else {
        console.log(`⚠️ No sound file found for phase: ${phaseName}`);
    }
}
// --- TIMER FUNCTIONALITY ---
let timerInterval = null;
let currentPhaseIndex = 0;
let currentTime = 0;
const phaseNames = ['prep', 'effort', 'rest', 'end'];
const phaseLabels = {
    prep: 'Préparation',
    effort: 'Effort',
    rest: 'Repos',
    end: 'Fin'
};

function startTimer() {
    if (!window.timerPhases) return;

    // If timer is already running, don't start again
    if (timerInterval) return;

    // Start Ambient
    playAmbient();

    const currentPhaseName = phaseNames[currentPhaseIndex];
    const phaseTime = window.timerPhases[currentPhaseName];

    // If current time is 0, initialize it
    if (currentTime === 0) {
        currentTime = phaseTime;
    }

    updatePhaseDisplay();

    // Play sound for current phase
    playPhaseSound(currentPhaseName);

    timerInterval = setInterval(() => {
        currentTime--;

        // Update display
        const currentPhaseName = phaseNames[currentPhaseIndex];
        document.querySelector(`#${currentPhaseName}-timer span`).textContent = currentTime;

        if (currentTime <= 0) {
            // Move to next phase
            currentPhaseIndex++;

            if (currentPhaseIndex >= phaseNames.length) {
                // All phases complete
                clearInterval(timerInterval);
                timerInterval = null;
                document.getElementById('current-phase').textContent = '✅ Terminé!';
                stopAmbient();
                return;
            }

            // Start next phase
            const nextPhaseName = phaseNames[currentPhaseIndex];
            currentTime = window.timerPhases[nextPhaseName];
            updatePhaseDisplay();

            // Play sound for next phase
            playPhaseSound(nextPhaseName);
        }
    }, 1000);
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        document.getElementById('current-phase').textContent += ' ⏸️ (Pause)';
        stopAmbient();
    }
}

function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    stopAmbient();

    currentPhaseIndex = 0;
    currentTime = 0;

    // Reset all displays to original values
    if (window.timerPhases) {
        document.querySelector('#prep-timer span').textContent = window.timerPhases.prep;
        document.querySelector('#effort-timer span').textContent = window.timerPhases.effort;
        document.querySelector('#rest-timer span').textContent = window.timerPhases.rest;
        document.querySelector('#end-timer span').textContent = window.timerPhases.end;
    }

    document.getElementById('current-phase').textContent = '';
}

function updatePhaseDisplay() {
    const currentPhaseName = phaseNames[currentPhaseIndex];
    const label = phaseLabels[currentPhaseName];
    document.getElementById('current-phase').textContent = `🎯 Phase actuelle: ${label}`;
}

// Event listeners for timer buttons
document.getElementById('start-timer').addEventListener('click', startTimer);
document.getElementById('pause-timer').addEventListener('click', pauseTimer);
document.getElementById('reset-timer').addEventListener('click', resetTimer);

// Display exercise demonstration
function displayExerciseDemonstration(exerciseData) {
    const demonstrationSection = document.getElementById('exercise-demonstration');
    const exerciseImage = document.getElementById('exercise-image');

    if (exerciseData && exerciseData.Image) {
        exerciseImage.src = exerciseData.Image;
        exerciseImage.alt = `Démonstration pour ${exerciseData.Exercice}`;
        demonstrationSection.style.display = 'block';
    } else {
        demonstrationSection.style.display = 'none';
        exerciseImage.src = '';
        exerciseImage.alt = 'Démonstration de l\'exercice';
    }
}

// Update information and timer when exercise is selected
function updateExerciseDisplay(exerciseName) {
    const exerciseData = findExerciseDetails(exerciseName);
    displayExerciseInfo(exerciseData);
    displayExerciseDemonstration(exerciseData);
    initializeTimer(exerciseData);
}

// Add click listener to autocomplete items to update display
const autocompleteItems = document.getElementById('autocomplete-list');
autocompleteItems.addEventListener('click', function (e) {
    if (e.target.classList.contains('autocomplete-item')) {
        const exerciseName = e.target.getElementsByTagName("input")[0].value;
        setTimeout(() => updateExerciseDisplay(exerciseName), 100);
    }
});

// Also update when user manually types and leaves the field
exerciseInput.addEventListener('blur', function () {
    if (this.value) {
        setTimeout(() => updateExerciseDisplay(this.value), 100);
    }
});

// --- AUDIO PLAYER LOGIC ---
const ambientAudioPlayer = document.getElementById('ambient-audio-player');
const playlistContainer = document.getElementById('playlist');
const playPauseBtnAudio = document.getElementById('play-pause-audio');
const prevBtn = document.getElementById('prev-track');
const nextBtn = document.getElementById('next-track');
const shuffleBtn = document.getElementById('shuffle-playlist');
const trackInfoSpan = document.getElementById('track-info');
const progressBar = document.getElementById('progress-bar');
const progressBarWrapper = document.querySelector('.progress-bar-wrapper');
const currentTimeSpan = document.getElementById('current-time');
const totalDurationSpan = document.getElementById('total-duration');
const volumeSlider = document.getElementById('volume-slider');
const volumeLevel = document.getElementById('volume-level');



if (!ambientAudioPlayer || typeof SOUND_MANIFEST === 'undefined' || !SOUND_MANIFEST.ambient) {
    const playerContainer = document.getElementById('audio-player-container');
    if (playerContainer) {
        playerContainer.style.display = 'none';
    }
} else {
    let playlist = [...SOUND_MANIFEST.ambient];
    let originalPlaylist = [...SOUND_MANIFEST.ambient]; // For unshuffling
    let currentTrackIndex = 0;
    let isShuffled = false;

    // Helper to format time from seconds to MM:SS
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function loadTrack(index) {
        if (index >= 0 && index < playlist.length) {
            currentTrackIndex = index;
            const trackName = playlist[currentTrackIndex];
            ambientAudioPlayer.src = getSoundPath(trackName);
            ambientAudioPlayer.volume = volumeSlider.value;
            if (trackInfoSpan) trackInfoSpan.textContent = trackName.replace('.mp3', '');
            updatePlaylistUI();
        }
    }

    function updatePlaylistUI() {
        if (!playlistContainer) return;
        playlistContainer.innerHTML = '';
        playlist.forEach((track, index) => {
            const li = document.createElement('li');
            const label = track.includes('/') ? track.split('/').pop() : track;
            li.textContent = label.replace('.mp3', '');
            li.dataset.index = index;
            if (index === currentTrackIndex) {
                li.classList.add('active');
            }
            li.addEventListener('click', () => {
                loadTrack(index);
                ambientAudioPlayer.play();
            });
            playlistContainer.appendChild(li);
        });
    }

    function playPauseAudio() {
        if (ambientAudioPlayer.src) {
            if (ambientAudioPlayer.paused) {
                ambientAudioPlayer.play();
            } else {
                ambientAudioPlayer.pause();
            }
        } else {
            // If no src is set, load the first track and play
            loadTrack(0);
            ambientAudioPlayer.play();
        }
    }

    function updatePlayPauseIcon() {
        if (playPauseBtnAudio) {
            playPauseBtnAudio.textContent = ambientAudioPlayer.paused ? '▶️' : '⏸️';
        }
    }

    function prevTrack() {
        let newIndex = currentTrackIndex - 1;
        if (newIndex < 0) {
            newIndex = playlist.length - 1; // Loop to the end
        }
        loadTrack(newIndex);
        ambientAudioPlayer.play();
    }

    function nextTrack() {
        let newIndex = currentTrackIndex + 1;
        if (newIndex >= playlist.length) {
            newIndex = 0; // Loop to the beginning
        }
        loadTrack(newIndex);
        ambientAudioPlayer.play();
    }

    function shufflePlaylist() {
        isShuffled = !isShuffled;
        const currentTrack = playlist[currentTrackIndex];

        if (isShuffled) {
            // Shuffle the playlist
            // Fisher-Yates shuffle
            for (let i = playlist.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
            }
            if (shuffleBtn) shuffleBtn.classList.add('active');
        } else {
            // Unshuffle - revert to original order
            playlist = [...originalPlaylist];
            if (shuffleBtn) shuffleBtn.classList.remove('active');
        }

        // Find the index of the previously playing track in the new playlist order
        const newTrackIndex = playlist.indexOf(currentTrack);
        if (newTrackIndex !== -1) {
            currentTrackIndex = newTrackIndex;
        } else {
            // Failsafe if track not found
            currentTrackIndex = 0;
        }

        updatePlaylistUI();
    }

    // --- Progress Bar and Time Updates ---
    function updateProgress() {
        if (!ambientAudioPlayer.duration) return;
        const progressPercent = (ambientAudioPlayer.currentTime / ambientAudioPlayer.duration) * 100;
        if (progressBar) progressBar.style.width = `${progressPercent}%`;
        if (currentTimeSpan) currentTimeSpan.textContent = formatTime(ambientAudioPlayer.currentTime);
    }

    function setDuration() {
        if (totalDurationSpan) totalDurationSpan.textContent = formatTime(ambientAudioPlayer.duration);
    }

    function seek(e) {
        if (!ambientAudioPlayer.duration) return;
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = ambientAudioPlayer.duration;
        ambientAudioPlayer.currentTime = (clickX / width) * duration;
    }


    // Event Listeners
    if (playPauseBtnAudio) playPauseBtnAudio.addEventListener('click', playPauseAudio);
    if (prevBtn) prevBtn.addEventListener('click', prevTrack);
    if (nextBtn) nextBtn.addEventListener('click', nextTrack);
    if (shuffleBtn) shuffleBtn.addEventListener('click', shufflePlaylist);

    if (volumeSlider) {
        volumeSlider.addEventListener('input', () => {
            const newVolume = volumeSlider.value;
            ambientAudioPlayer.volume = newVolume;
            if (currentAmbientAudio) {
                currentAmbientAudio.volume = newVolume;
            }
            if (volumeLevel) {
                volumeLevel.textContent = `${Math.round(newVolume * 100)}%`;
            }
        });
    }

    ambientAudioPlayer.addEventListener('play', updatePlayPauseIcon);
    ambientAudioPlayer.addEventListener('pause', updatePlayPauseIcon);
    ambientAudioPlayer.addEventListener('ended', nextTrack);
    ambientAudioPlayer.addEventListener('timeupdate', updateProgress);
    ambientAudioPlayer.addEventListener('loadedmetadata', setDuration);
    if (progressBarWrapper) progressBarWrapper.addEventListener('click', seek);



    // Initial Load
    populateSessionSelector();
    // --- COUNTDOWN TIMER FUNCTIONALITY ---
    const countdownInput = document.getElementById('countdown-time-input');
    const startCountdownBtn = document.getElementById('start-countdown');
    const pauseCountdownBtn = document.getElementById('pause-countdown');
    const resetCountdownBtn = document.getElementById('reset-countdown');
    const countdownSoundThemeSelector = document.getElementById('countdown-sound-theme');

    let countdownInterval = null;
    let countdownTime = parseInt(countdownInput.value, 10);
    let isCountdownRunning = false;
    let initialCountdownTime = countdownTime;

    function playCountdownSound() {
        const selectedTheme = countdownSoundThemeSelector.value;
        if (typeof SOUND_MANIFEST === 'undefined' || !SOUND_MANIFEST.files) {
            console.log('⚠️ SOUND_MANIFEST not loaded');
            return;
        }

        // Ensure folder name is correctly formatted (e.g., Prep, Effort)
        const folderName = selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1);
        const eligibleFiles = SOUND_MANIFEST.files.filter(f => f.startsWith(`${folderName}/`));

        if (eligibleFiles.length === 0) {
            console.log(`⚠️ Aucun son trouvé dans le dossier: ${folderName}`);
            return;
        }


        const randomFile = eligibleFiles[Math.floor(Math.random() * eligibleFiles.length)];
        const fullPath = getSoundPath(randomFile);

        try {
            const audio = new Audio(fullPath);
            audio.play().catch(err => console.log('Erreur audio:', err));
        } catch (error) {
            console.log('Erreur audio:', error);
        }
    }

    function startCountdown() {
        if (isCountdownRunning) return;

        isCountdownRunning = true;
        countdownInterval = setInterval(() => {
            countdownTime--;
            countdownInput.value = countdownTime;

            if (countdownTime <= 0) {
                clearInterval(countdownInterval);
                isCountdownRunning = false;
                playCountdownSound();
                // Reset to initial time for next run
                countdownTime = initialCountdownTime;
                countdownInput.value = countdownTime;
            }
        }, 1000);
    }

    function pauseCountdown() {
        clearInterval(countdownInterval);
        isCountdownRunning = false;
    }

    function resetCountdown() {
        clearInterval(countdownInterval);
        isCountdownRunning = false;
        // Reset to the time currently in the input field
        initialCountdownTime = parseInt(countdownInput.value, 10) || 60;
        countdownTime = initialCountdownTime;
        countdownInput.value = countdownTime;
    }

    // Update initial time when user changes it
    countdownInput.addEventListener('change', () => {
        let newTime = parseInt(countdownInput.value, 10);
        if (isNaN(newTime) || newTime < 1) {
            newTime = 60; // Default to 60 if input is invalid
        }
        countdownInput.value = newTime;
        initialCountdownTime = newTime;
        if (!isCountdownRunning) {
            countdownTime = initialCountdownTime;
        }
    });


    startCountdownBtn.addEventListener('click', startCountdown);
    pauseCountdownBtn.addEventListener('click', pauseCountdown);
    resetCountdownBtn.addEventListener('click', resetCountdown);
}

// --- SÉANCE PRÉ-PROGRAMMÉE ---

// Nouvelle fonction pour charger une session depuis une URL
async function loadSessionFromUrl(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur réseau: ${response.statusText}`);
        }
        const goalData = await response.json();
        displaySessionGoal(goalData);
        showStatus('✅ Objectif de séance chargé depuis l\'URL.');
    } catch (error) {
        alert("Erreur lors du chargement de la session : " + error.message);
    }
}

// Nouvelle fonction pour peupler le sélecteur de session depuis GitHub
async function populateSessionSelector() {
    const selector = document.getElementById('session-url-selector');
    if (!selector) return;

    // URL de l'API GitHub pour le contenu de votre dossier Session
    const GITHUB_API_URL = 'https://api.github.com/repos/darkshadowblood/workout-android/contents/Session';

    try {
        const response = await fetch(GITHUB_API_URL);
        if (!response.ok) {
            throw new Error('Impossible de lister les fichiers depuis GitHub.');
        }
        const files = await response.json();

        // Filtrer pour ne garder que les fichiers .json
        const jsonFiles = files.filter(file => file.name.endsWith('.json'));

        if (jsonFiles.length > 0) {
            // Ajouter une option par défaut
            selector.innerHTML = '<option value="">-- Choisir une séance en ligne --</option>';
            jsonFiles.forEach(file => {
                const option = document.createElement('option');
                option.value = file.download_url; // URL de téléchargement direct
                option.textContent = file.name.replace('.json', '').replace(/_/g, ' ');
                selector.appendChild(option);
            });

            // Ajouter un écouteur d'événement pour charger la session au changement
            selector.addEventListener('change', (event) => {
                const url = event.target.value;
                if (url) {
                    loadSessionFromUrl(url);
                }
            });

        } else {
            selector.innerHTML = '<option value="">-- Aucune séance en ligne trouvée --</option>';
        }

    } catch (error) {
        console.error("Erreur GitHub API:", error);
        selector.innerHTML = '<option value="">-- Erreur de chargement --</option>';
    }
}


function loadSessionGoal(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const goalData = JSON.parse(e.target.result);
            displaySessionGoal(goalData);
        } catch (error) {
            alert("Erreur lors de la lecture du fichier JSON : " + error.message);
        }
    };
    reader.readAsText(file);
}

function displaySessionGoal(goalData) {
    const displayElement = document.getElementById('session-goal-display');
    if (!displayElement) return;

    // Clear previous goal
    displayElement.innerHTML = '';

    if (!goalData || !goalData.exercises || goalData.exercises.length === 0) {
        displayElement.innerHTML = '<p>Le fichier ne contient aucun exercice.</p>';
        return;
    }

    let html = `<h4>Objectif : ${goalData.session || 'Séance sans nom'}</h4>`;
    html += '<ul id="goal-list">';

    goalData.exercises.forEach((exercise, index) => {
        const exerciseJson = JSON.stringify(exercise).replace(/'/g, "&apos;");
        html += `<li id="goal-item-${index}" onclick='fillLogForm(${exerciseJson})' style="cursor: pointer; list-style-type: none; margin-left: -20px;">`;
        html += `<input type="checkbox" onclick="toggleGoalItem(event, this, ${index})" style="margin-right: 10px;">`;
        html += `<span>`;
        html += `<strong>${exercise.exercise}</strong>: `;
        let details = [];
        if (exercise.set) details.push(`Séries: ${exercise.set}`);
        if (exercise.reps) details.push(`Reps: ${exercise.reps}`);
        if (exercise.weight) details.push(`Poids: ${exercise.weight} lb`);
        if (exercise.duration) details.push(`Temps: ${exercise.duration}`);
        html += details.join(', ');
        html += `</span></li>`;
    });

    html += '</ul>';
    displayElement.innerHTML = html;
}

function toggleGoalItem(event, checkbox, index) {
    event.stopPropagation(); // Prevent the li's onclick from firing
    const listItem = document.getElementById(`goal-item-${index}`);
    const span = listItem.querySelector('span'); // Cible le span pour le style
    if (checkbox.checked) {
        span.style.textDecoration = 'line-through';
        span.style.color = '#888';
    } else {
        span.style.textDecoration = 'none';
        span.style.color = 'inherit';
    }
}

function fillLogForm(exerciseData) {
    document.getElementById('exercise').value = exerciseData.exercise || '';
    document.getElementById('setNum').value = exerciseData.set || '1';
    document.getElementById('reps').value = exerciseData.reps || '';
    document.getElementById('weight').value = exerciseData.weight || '';
    document.getElementById('steps').value = exerciseData.steps || '';
    document.getElementById('distance').value = exerciseData.distance || '';
    document.getElementById('kcal').value = exerciseData.kcal || '';
    document.getElementById('duration').value = exerciseData.duration || '';
    document.getElementById('avgHr').value = exerciseData.avgHr || '';
    document.getElementById('maxHr').value = exerciseData.maxHr || '';
    document.getElementById('notes').value = exerciseData.notes || '';

    // Mettre à jour l'affichage des informations sur l'exercice
    updateExerciseDisplay(exerciseData.exercise);
}

// --- COLLAPSIBLE SECTIONS ---
const headers = document.querySelectorAll('.collapsible-header');
headers.forEach(header => {
    header.style.cursor = 'pointer';
    header.addEventListener('click', function () {
        const content = this.nextElementSibling;
        if (content && content.classList.contains('collapsible-content')) {
            if (content.style.display === 'block') {
                content.style.display = 'none';
            } else {
                content.style.display = 'block';
            }
        }
    });
});