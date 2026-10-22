const SUPABASE_URL = 'https://rioyrsemrzcznwhjwanj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpb3lyc2Vtcnpjem53aGp3YW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNjUwNDAsImV4cCI6MjEwNzg0MTA0MH0.lkjOmIPdqWCWm6h42RkJNjnjFciFQxATcsTx8knPUeg';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUserEmail = '';
let allPostsData = [];
let allCommentsData = [];
let currentSubratitaFiltro = 'todos';
let knownCommentsCount = 0;

// Lista de usuarios considerados creadores/admins
const ADMIN_USERS = ['doryansanchez72'];

function obtenerBadgeUser(username) {
    let cleanUser = escapeHtml(username);
    if (ADMIN_USERS.includes(username)) {
        return `<span class="postername">ur/${cleanUser}</span> <img src="assets/web/admin.log.png" alt="Admin" style="height: 18px; vertical-align: middle; margin: 0 4px;" title="Creador / Admin">`;
    }
    return `<span class="postername">ur/${cleanUser}</span>`;
}

function solicitarPermisoNotificaciones() {
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                alert("¡Notificaciones activadas correctamente! Te avisaremos cuando respondan a tus publicaciones.");
            } else if (permission === "denied") {
                alert("Bloqueaste las notificaciones. Puedes activarlas en la configuración de tu navegador.");
            }
        });
    } else {
        alert("Tu navegador no soporta notificaciones del celular.");
    }
}

function enviarNotificacionCelular(titulo, mensaje) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(titulo, {
            body: mensaje,
            icon: 'assets/web/favicon.png'
        });
    }
}

function togglePublishBox() {
    let pubDiv = document.getElementById('tab-publicar');
    let perfilDiv = document.getElementById('tab-perfil');
    let btnCerrar = document.getElementById('btn-cerrar-post');
    
    perfilDiv.style.display = 'none';
    
    if (pubDiv.style.display === 'none' || pubDiv.style.display === '') {
        pubDiv.style.display = 'block';
        btnCerrar.style.display = 'inline-block';
        document.getElementById('p-subratita').focus();
    } else {
        pubDiv.style.display = 'none';
        btnCerrar.style.display = 'none';
    }
}

function cerrarCajaPost() {
    document.getElementById('tab-publicar').style.display = 'none';
    document.getElementById('tab-perfil').style.display = 'none';
    document.getElementById('btn-cerrar-post').style.display = 'none';
}

function verTab(tabName) {
    let pubDiv = document.getElementById('tab-publicar');
    let perfilDiv = document.getElementById('tab-perfil');
    let btnCerrar = document.getElementById('btn-cerrar-post');

    if (tabName === 'publicar') {
        pubDiv.style.display = 'block';
        perfilDiv.style.display = 'none';
        btnCerrar.style.display = 'inline-block';
    } else {
        pubDiv.style.display = 'none';
        perfilDiv.style.display = 'block';
        btnCerrar.style.display = 'none';
    }
}

function actualizarContador() {
    let textarea = document.getElementById('p-content');
    let counter = document.getElementById('char-counter');
    let restantes = 500 - textarea.value.length;
    counter.innerText = `${restantes} / 500`;
    localStorage.setItem('norros_draft', textarea.value);
}

function cargarBorrador() {
    let saved = localStorage.getItem('norros_draft');
    if (saved) {
        let textarea = document.getElementById('p-content');
        if (textarea) {
            textarea.value = saved;
            actualizarContador();
        }
    }
}

async function handleSignUp() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const msg = document.getElementById('status-msg');

    if (!email || !password) {
        msg.style.color = "red";
        msg.innerText = "Escribe correo y contraseña.";
        return;
    }

    msg.style.color = "blue";
    msg.innerText = "Registrando...";

    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
        msg.style.color = "red";
        msg.innerText = "Error: " + error.message;
        return;
    }

    if (data && data.user) {
        const usernameVal = email.split('@')[0];
        await supabaseClient.from('users').insert([{ username: usernameVal }]);
        msg.style.color = "green";
        msg.innerText = "¡Cuenta creada!";
        checkSession();
    }
}

async function handleSignIn() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const msg = document.getElementById('status-msg');

    if (!email || !password) {
        msg.style.color = "red";
        msg.innerText = "Escribe correo y contraseña.";
        return;
    }

    msg.style.color = "blue";
    msg.innerText = "Conectando...";

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        msg.style.color = "red";
        msg.innerText = "Error: " + error.message;
    } else {
        msg.style.color = "green";
        msg.innerText = "¡Bienvenido!";
        checkSession();
    }
}

async function handleSignOut() {
    await supabaseClient.auth.signOut();
    checkSession();
    cerrarCajaPost();
}

async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const authBox = document.getElementById('auth-box');
    const postBox = document.getElementById('post-box');
    const userDisplay = document.getElementById('current-user-display');
    const navLoginBtn = document.getElementById('nav-login-btn');

    if (session) {
        currentUserEmail = session.user.email;
        const username = currentUserEmail.split('@')[0];
        
        userDisplay.innerHTML = obtenerBadgeUser(username);

        document.getElementById('profile-username').innerHTML = obtenerBadgeUser(username);
        document.getElementById('profile-email').innerText = currentUserEmail;
        document.getElementById('profile-id').innerText = session.user.id;
        document.getElementById('profile-last-login').innerText = new Date(session.user.last_sign_in_at).toLocaleString();

        authBox.style.display = 'none';
        postBox.style.display = 'block';
        navLoginBtn.innerText = `[ur/${username}]`;

        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    } else {
        currentUserEmail = '';
        authBox.style.display = 'block';
        postBox.style.display = 'none';
        navLoginBtn.innerText = '[Login]';
        document.getElementById('status-msg').innerText = '';
    }
}

function focusLogin() {
    if (currentUserEmail) {
        let perfilDiv = document.getElementById('tab-perfil');
        let pubDiv = document.getElementById('tab-publicar');
        let btnCerrar = document.getElementById('btn-cerrar-post');
        
        pubDiv.style.display = 'none';
        btnCerrar.style.display = 'none';
        perfilDiv.style.display = perfilDiv.style.display === 'none' ? 'block' : 'none';
    } else {
        document.getElementById('email').focus();
    }
}

async function enviarPost() {
    let subForumSelect = document.getElementById('p-subratita').value;
    let content = document.getElementById('p-content').value.trim();
    let status = document.getElementById('post-status');

    if (!subForumSelect) {
        status.style.color = 'red';
        status.innerText = "Selecciona una SubRatita (SR) de la lista.";
        document.getElementById('p-subratita').focus();
        return;
    }

    if (!content) {
        status.style.color = 'red';
        status.innerText = "Escribe un mensaje.";
        document.getElementById('p-content').focus();
        return;
    }

    status.style.color = 'blue';
    status.innerText = "Publicando...";

    let authorName = currentUserEmail ? currentUserEmail.split('@')[0] : 'Anónimo';

    let { error } = await supabaseClient.from('jodidosPOST').insert([
        { username: authorName, content: content, SubForum: subForumSelect }
    ]);

    if (error) {
        status.style.color = 'red';
        status.innerText = "Error: " + error.message;
    } else {
        status.style.color = 'green';
        status.innerText = "¡Publicado!";
        document.getElementById('p-content').value = '';
        document.getElementById('p-subratita').value = '';
        localStorage.removeItem('norros_draft');
        actualizarContador();
        cerrarCajaPost();
        cargarPosts();
    }
}

async function borrarPost(postId) {
    if (!confirm("¿Seguro que quieres borrar esta publicación?")) return;

    let { error } = await supabaseClient.from('jodidosPOST').delete().eq('id', postId);
    if (!error) {
        cargarPosts();
    } else {
        alert("Error al borrar: " + error.message);
    }
}

async function enviarComentario(postId) {
    let input = document.getElementById(`comment-input-${postId}`);
    let content = input.value.trim();

    if (!content) return;

    let authorName = currentUserEmail ? currentUserEmail.split('@')[0] : 'Anónimo';

    let { error } = await supabaseClient.from('JodeteComentarios').insert([
        { post_ID: postId, username: authorName, content: content }
    ]);

    if (!error) {
        input.value = '';
        cargarPosts();
    } else {
        alert("Error al comentar: " + error.message);
    }
}

async function borrarComentario(commentId) {
    if (!confirm("¿Seguro que quieres borrar este comentario?")) return;

    let { error } = await supabaseClient.from('JodeteComentarios').delete().eq('id', commentId);
    if (!error) {
        cargarPosts();
    } else {
        alert("Error al borrar el comentario: " + error.message);
    }
}

function toggleReplyBox(postId) {
    let box = document.getElementById(`reply-form-${postId}`);
    if(box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function formatMessage(text) {
    let escaped = escapeHtml(text);
    let lines = escaped.split('\n');
    let formattedLines = lines.map(line => {
        if (line.trim().startsWith('&gt;')) {
            return `<span class="greentext">${line}</span>`;
        }
        return line;
    });
    return formattedLines.join('<br>');
}

function filtrarPorSubratita(sub) {
    currentSubratitaFiltro = sub;
    renderFeed(allPostsData, allCommentsData);
    actualizarNavSubratitas();
}

function filtrarPosts() {
    renderFeed(allPostsData, allCommentsData);
}

async function cargarPosts() {
    let feed = document.getElementById('feed');

    let { data: posts, error } = await supabaseClient.from('jodidosPOST').select('*');

    if (error) {
        feed.innerHTML = `<div style="color:red; text-align:center;">Error cargando posts: ${error.message}</div>`;
        return;
    }

    if (!posts || posts.length === 0) {
        feed.innerHTML = `<div style="text-align:center; font-size:11px;">No hay publicaciones todavía. ¡Sé el primero en publicar!</div>`;
        return;
    }

    for (let i = posts.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [posts[i], posts[j]] = [posts[j], posts[i]];
    }

    let { data: comentarios } = await supabaseClient.from('JodeteComentarios').select('*').order('created_at', { ascending: true });

    let nuevosComentarios = comentarios || [];

    if (currentUserEmail && knownCommentsCount > 0 && nuevosComentarios.length > knownCommentsCount) {
        let currentUsername = currentUserEmail.split('@')[0];
        let misPostIds = posts.filter(p => p.username === currentUsername).map(p => p.id);
        
        let ultimosComentarios = nuevosComentarios.slice(knownCommentsCount);
        ultimosComentarios.forEach(c => {
            if (misPostIds.includes(c.post_ID) && c.username !== currentUsername) {
                enviarNotificacionCelular(
                    `¡Nueva respuesta en NiñosRata.com!`,
                    `ur/${c.username} te respondió: "${c.content.substring(0, 40)}..."`
                );
            }
        });
    }

    knownCommentsCount = nuevosComentarios.length;
    allPostsData = posts;
    allCommentsData = nuevosComentarios;

    actualizarNavSubratitas();
    renderFeed(allPostsData, allCommentsData);
}

function actualizarNavSubratitas() {
    let navDiv = document.getElementById('subratitas-nav');
    if (!navDiv) return;

    let subsUnicas = [...new Set(allPostsData.map(p => p.SubForum || 'general'))];
    
    let html = `<button class="btn-chan ${currentSubratitaFiltro === 'todos' ? 'active-sub' : ''}" onclick="filtrarPorSubratita('todos')">[Todos]</button>`;
    
    subsUnicas.forEach(sub => {
        let activeClass = currentSubratitaFiltro === sub ? 'active-sub' : '';
        html += `<button class="btn-chan ${activeClass}" onclick="filtrarPorSubratita('${sub}')">[sr/${sub}]</button>`;
    });

    navDiv.innerHTML = html;
}

function renderFeed(posts, comentarios) {
    let feed = document.getElementById('feed');
    let currentUsername = currentUserEmail ? currentUserEmail.split('@')[0] : '';
    let searchQuery = document.getElementById('search-input') ? document.getElementById('search-input').value.toLowerCase().trim() : '';

    let filtrados = posts.filter(p => {
        let pSub = p.SubForum || 'general';
        let subMatches = currentSubratitaFiltro === 'todos' || pSub === currentSubratitaFiltro;
        let searchMatches = !searchQuery || p.username.toLowerCase().includes(searchQuery) || p.content.toLowerCase().includes(searchQuery) || pSub.toLowerCase().includes(searchQuery);
        return subMatches && searchMatches;
    });

    if (!filtrados || filtrados.length === 0) {
        feed.innerHTML = `<div style="text-align:center; font-size:11px;">No se encontraron publicaciones en este SR.</div>`;
        return;
    }

    feed.innerHTML = '';
    filtrados.forEach(p => {
        let fecha = new Date(p.created_at).toLocaleString();
        let subName = p.SubForum || 'general';
        let misComentarios = comentarios ? comentarios.filter(c => c.post_ID === p.id) : [];
        let commentsHTML = '';

        misComentarios.forEach(c => {
            let cFecha = new Date(c.created_at).toLocaleString();
            let esMiComentario = currentUsername && currentUsername === c.username;
            let deleteCommentBtn = esMiComentario ? `<span class="delete-btn" onclick="borrarComentario(${c.id})">[Borrar]</span>` : '';

            commentsHTML += `
                <div class="comment-card">
                    ${obtenerBadgeUser(c.username)}
                    <span style="color:#666; font-size:10px;">${cFecha}</span>
                    ${deleteCommentBtn}
                    <div style="margin-top:2px;">${formatMessage(c.content)}</div>
                </div>
            `;
        });

        let replyFormHTML = currentUserEmail ? `
            <div id="reply-form-${p.id}" style="display:none; margin-top:8px;">
                <input type="text" id="comment-input-${p.id}" maxlength="500" placeholder="Escribe tu respuesta..." style="width:70%;">
                <button class="btn-chan" onclick="enviarComentario(${p.id})">Enviar</button>
            </div>
        ` : `<div style="font-size:10px; color:#666; margin-top:5px;">(Inicia sesión para responder)</div>`;

        let esMiPost = currentUsername && currentUsername === p.username;
        let deletePostBtn = esMiPost ? `<span class="delete-btn" onclick="borrarPost(${p.id})">[Borrar]</span>` : '';

        feed.innerHTML += `
            <div class="post-card">
                <div class="post-header">
                    ${obtenerBadgeUser(p.username)}
                    <span style="color: #004400; font-weight: bold; cursor: pointer;" onclick="filtrarPorSubratita('${subName}')">sr/${subName}</span>
                    <span>${fecha}</span>
                    <span style="float:right;">No. ${p.id}</span>
                </div>
                <div class="message">${formatMessage(p.content)}</div>

                <span class="reply-btn" onclick="toggleReplyBox(${p.id})">[Responder]</span> (${misComentarios.length} comentarios)
                ${deletePostBtn}

                ${replyFormHTML}

                <div class="comments-section">
                    ${commentsHTML}
                </div>
            </div>
        `;
    });
}

function escapeHtml(text) {
    return text ? text.replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t])) : '';
}

checkSession();
cargarBorrador();
cargarPosts();

setInterval(() => {
    cargarPosts();
}, 15000);
