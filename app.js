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
            option.textContent = `🎵 ${file}`;
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
            ambientFile = `sounds/${SOUND_MANIFEST.ambient[randomIndex]}`;
        } else {
            // Legacy string support
            ambientFile = `sounds/${SOUND_MANIFEST.ambient}`;
        }
    } else {
        // Specific file selected
        ambientFile = `sounds/${selectedAmbient}`;
    }

    currentAmbientAudio = new Audio(ambientFile);
    currentAmbientAudio.loop = true;
    currentAmbientAudio.volume = 0.5;

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

    // Phase names in manifest are capitalized: Prep, Effort, Rest, End
    const phasePrefix = phaseName.charAt(0).toUpperCase() + phaseName.slice(1);

    let eligibleFiles = SOUND_MANIFEST.files.filter(f => f.startsWith(phasePrefix));
    console.log(`🔊 Files starting with "${phasePrefix}":`, eligibleFiles);

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
    const fullPath = `sounds/${randomFile}`;
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

// Update information and timer when exercise is selected
function updateExerciseDisplay(exerciseName) {
    const exerciseData = findExerciseDetails(exerciseName);
    displayExerciseInfo(exerciseData);
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