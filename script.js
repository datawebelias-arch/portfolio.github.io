// ==========================================
// 1. CONFIGURATION SUPABASE
// ==========================================
const SUPABASE_URL = 'https://bapbiqcllcibwjedcjux.supabase.co'; // Remplace
const SUPABASE_KEY = 'sb_publishable_vcKvEPHg0QPD9EP2zcykSw_jTf3RKDU'; // Remplace
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// 2. AFFICHAGE DES PROJETS
// ==========================================
async function loadProjects() {
    const { data: projects, error } = await supabaseClient
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) { 
        console.error('Erreur de chargement:', error); 
        return; 
    }

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

// ==========================================
// 3. COULOIR 3D (Version optimale en Pixels)
// ==========================================
function initCorridor() {
    const PATH = {
        perspective: 1000, 
        cardWidth: 160, 
        cardHeight: 220,
        cardRadius: 12,
        birthHeight: 30,   // Taille min au fond du tunnel
        exitHeight: 350,   // Taille max en sortant de l'écran
        railBirth: -120,   // Décalage au centre
        railExit: 500,     // Décalage sur les côtés
        fan: 3.3,
        turnBirth: 6,
        turnExit: 28,
        stops: 24
    };

    // Images du couloir (Mets ici les images de tes projets si tu le souhaites)
    const images = [
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=400",
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=400",
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=400"
    ];
    const cardsCount = 9;
    const speed = 18;
    const axis = 50;

    function generateKeyframes(dir, name) {
        let steps = [];
        for (let s = 0; s <= PATH.stops; s++) {
            const u = s / PATH.stops;
            const scale = (PATH.birthHeight / PATH.cardHeight) * Math.pow(PATH.exitHeight / PATH.birthHeight, u);
            const z = PATH.perspective * (1 - 1 / scale);
            const rail = PATH.railExit - (PATH.railExit - PATH.railBirth) * Math.pow(1 - u, PATH.fan);
            const turn = PATH.turnBirth + (PATH.turnExit - PATH.turnBirth) * u;
            
            steps.push(`${(u * 100).toFixed(2)}%{transform:translate3d(${(dir * rail).toFixed(2)}px,0,${z.toFixed(2)}px) rotateY(${(-dir * turn).toFixed(2)}deg)}`);
        }
        return `@keyframes ${name}{${steps.join("")}}`;
    }

    const css = `
        ${generateKeyframes(1, 'ish-r')}
        ${generateKeyframes(-1, 'ish-l')}
        @media(prefers-reduced-motion:reduce){.ish-c{animation-play-state:paused}}
        #corridor-wrapper { position: absolute; inset: 0; perspective: ${PATH.perspective}px; perspective-origin: 50% ${axis}%; }
        #corridor-3d { position: absolute; inset: 0; transform-style: preserve-3d; }
        .ish-c { position: absolute; left: 50%; top: ${axis}%; width: ${PATH.cardWidth}px; height: ${PATH.cardHeight}px; margin-left: -${PATH.cardWidth/2}px; margin-top: -${PATH.cardHeight/2}px; border-radius: ${PATH.cardRadius}px; overflow: hidden; backface-visibility: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
        .ish-c img { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
    `;

    const styleTag = document.createElement('style');
    styleTag.innerHTML = css;
    document.head.appendChild(styleTag);

    const container = document.getElementById('corridor-container');
    const wrapper = document.createElement('div');
    wrapper.id = 'corridor-wrapper';
    const inner3d = document.createElement('div');
    inner3d.id = 'corridor-3d';

    ['ish-r', 'ish-l'].forEach(name => {
        for (let i = 0; i < cardsCount; i++) {
            const imgSrc = images[i % images.length];
            const card = document.createElement('div');
            card.className = 'ish-c';
            card.style.animation = `${name} ${speed}s linear infinite`;
            card.style.animationDelay = `${-(i * speed) / cardsCount}s`;
            
            const img = document.createElement('img');
            img.src = imgSrc;
            img.loading = 'lazy'; // Optimisation: charge l'image seulement quand besoin
            
            card.appendChild(img);
            inner3d.appendChild(card);
        }
    });

    wrapper.appendChild(inner3d);
    container.appendChild(wrapper);
}

// ==========================================
// 4. INITIALISATION
// ==========================================
// On lance les fonctions quand le script se charge
loadProjects();
initCorridor();