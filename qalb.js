// 1. CONFIGURATION SUPABASE
const SUPABASE_URL = 'https://bapbiqcllcibwjedcjux.supabase.co'; // Remplace
const SUPABASE_KEY = 'sb_publishable_vcKvEPHg0QPD9EP2zcykSw_jTf3RKDU'; // Remplace
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

supabaseClient.auth.getSession().then(({ data: { session } }) => {
    updateUIBasedOnAuth(session);
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
    updateUIBasedOnAuth(session);
});

document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorP = document.getElementById('login-error');

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        errorP.innerText = "Erreur de connexion. Vérifiez vos identifiants.";
    } else {
        errorP.innerText = "";
    }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
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
        selectedFile = e.target.files[0];
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
    const { error: uploadError } = await supabaseClient.storage.from('portfolio-images').upload(fileName, selectedFile);

    if (uploadError) { alert('Erreur upload image.'); return; }

    const { data: publicUrlData } = supabaseClient.storage.from('portfolio-images').getPublicUrl(fileName);

    const { error: insertError } = await supabaseClient.from('projects').insert([{ 
        title: title, description: desc, project_url: url, image_url: publicUrlData.publicUrl 
    }]);

    if (insertError) { alert('Erreur BDD.'); return; }

    alert('Projet publié avec succès !');
    document.getElementById('project-title').value = '';
    document.getElementById('project-desc').value = '';
    document.getElementById('project-url').value = '';
    selectedFile = null;
    dropZone.querySelector('p').innerHTML = 'Glissez-déposez votre image ici<br>ou cliquez pour sélectionner';
    
    loadAdminProjects();
});

// 5. CHARGER ET SUPPRIMER DES PROJETS (ADMIN)
async function loadAdminProjects() {
    const { data: projects, error } = await supabaseClient
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) { 
        console.error('Erreur:', error); 
        return; 
    }

    const grid = document.getElementById('admin-projects-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    if (projects.length === 0) {
        grid.innerHTML = '<p>Aucun projet à gérer.</p>';
        return;
    }

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const imagePath = project.image_url.split('/portfolio-images/')[1];
        
        card.innerHTML = `
            <img src="${project.image_url}" alt="${project.title}" style="height: 120px; object-fit: cover;">
            <div class="card-content">
                <h3>${project.title}</h3>
                <button class="btn delete-btn" style="background: #ef4444; color: white; padding: 5px 15px; font-size: 0.9rem;" data-id="${project.id}" data-image="${imagePath}">Supprimer</button>
            </div>
        `;
        grid.appendChild(card);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const projectId = e.target.getAttribute('data-id');
            const imageToDelete = e.target.getAttribute('data-image');
            
            if (confirm("Voulez-vous vraiment supprimer ce projet ? L'image sera aussi supprimée du stockage.")) {
                const { error: storageError } = await supabaseClient.storage
                    .from('portfolio-images')
                    .remove([imageToDelete]);

                const { error: dbError } = await supabaseClient
                    .from('projects')
                    .delete()
                    .eq('id', projectId);

                if (storageError || dbError) {
                    alert('Une erreur est survenue lors de la suppression.');
                } else {
                    alert('Projet supprimé avec succès.');
                    loadAdminProjects();
                }
            }
        });
    });
}

supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (session) {
        loadAdminProjects();
    }
});