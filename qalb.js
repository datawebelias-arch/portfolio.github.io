// 1. CONFIGURATION SUPABASE
const SUPABASE_URL = 'COLLE_TON_URL_ICI'; // Remplace
const SUPABASE_KEY = 'COLLE_TA_CLE_ICI'; // Remplace
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. GESTION DE L'AUTHENTIFICATION
const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-section');

function updateUIBasedOnAuth(session) {
    if (session) {
        loginSection.style.display = 'none';
        adminSection.style.display = 'block';
    } else {
        loginSection.style.display = 'flex';
        adminSection.style.display = 'none';
    }
}

supabase.auth.getSession().then(({ data: { session } }) => {
    updateUIBasedOnAuth(session);
});

supabase.auth.onAuthStateChange((_event, session) => {
    updateUIBasedOnAuth(session);
});

document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorP = document.getElementById('login-error');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        errorP.innerText = "Erreur de connexion. Vérifiez vos identifiants.";
    } else {
        errorP.innerText = "";
    }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
});

// 3. GESTION DU DRAG & DROP
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
let selectedFile = null;

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        dropZone.querySelector('p').innerText = `Image sélectionnée : ${selectedFile.name}`;
    }
});
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); });
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        selectedFile = e.dataTransfer.files[0];
        dropZone.querySelector('p').innerText = `Image sélectionnée : ${selectedFile.name}`;
    }
});

// 4. ENVOI DU PROJET
document.getElementById('submit-btn').addEventListener('click', async () => {
    const title = document.getElementById('project-title').value;
    const desc = document.getElementById('project-desc').value;
    const url = document.getElementById('project-url').value;

    if (!selectedFile || !title || !desc || !url) {
        alert('Veuillez remplir tous les champs et sélectionner une image.');
        return;
    }

    const fileName = `${Date.now()}-${selectedFile.name}`;
    const { error: uploadError } = await supabase.storage.from('portfolio-images').upload(fileName, selectedFile);

    if (uploadError) { alert('Erreur upload image.'); return; }

    const { data: publicUrlData } = supabase.storage.from('portfolio-images').getPublicUrl(fileName);

    const { error: insertError } = await supabase.from('projects').insert([{ 
        title: title, description: desc, project_url: url, image_url: publicUrlData.publicUrl 
    }]);

    if (insertError) { alert('Erreur BDD.'); return; }

    alert('Projet publié avec succès !');
    document.getElementById('project-title').value = '';
    document.getElementById('project-desc').value = '';
    document.getElementById('project-url').value = '';
    selectedFile = null;
    dropZone.querySelector('p').innerHTML = 'Glissez-déposez votre image ici<br>ou cliquez pour sélectionner';
});