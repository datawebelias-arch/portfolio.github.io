// 1. CONFIGURATION SUPABASE
const SUPABASE_URL = 'https://bapbiqcllcibwjedcjux.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vcKvEPHg0QPD9EP2zcykSw_jTf3RKDU';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. AFFICHAGE DES PROJETS
async function loadProjects() {
    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) { console.error('Erreur:', error); return; }

    const grid = document.getElementById('projects-grid');
    grid.innerHTML = '';

    if (projects.length === 0) {
        grid.innerHTML = '<p>Aucun projet pour le moment.</p>';
        return;
    }

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${project.image_url}" alt="${project.title}">
            <div class="card-content">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <a href="${project.project_url}" target="_blank">Voir le projet →</a>
            </div>
        `;
        grid.appendChild(card);
    });
}

// INITIALISATION
loadProjects();