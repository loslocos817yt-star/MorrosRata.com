const SUPABASE_URL = 'https://rioyrsemrzcznwhjwanj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpb3lyc2Vtcnpjem53aGp3YW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNjUwNDAsImV4cCI6MjEwNzg0MTA0MH0.lkjOmIPdqWCWm6h42RkJNjnjFciFQxATcsTx8knPUeg';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUserEmail = '';
let allPostsData = [];
let allCommentsData = [];
let currentSubratitaFiltro = 'todos';
let knownCommentsCount = 0;
let captchaResultadoCorrecto = 0;

// Lista de usuarios considerados creadores/admins
const ADMIN_USERS = ['doryansanchez72'];

function escapeHtml(text) {
    return text ? text.replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t])) : '';
}

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

// CAPTCHA Matemático Simple
function generarCaptcha() {
    let num1 = Math.floor(Math.random() * 10) + 1;
    let num2 = Math.floor(Math.random() * 10) + 1;
    captchaResultadoCorrecto = num1 + num2;
    
    let el = document.getElementById('captcha-pregunta');
    if (el) {
        el.innerText = `${num1} + ${num2} =`;
    }
    let inputResp = document.getElementById('captcha-respuesta');
    if (inputResp) {
        inputResp.value = '';
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
        generarCaptcha();
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
        generarCaptcha();
    } else {
        pubDiv.style.display = 'none';
        perfilDiv.style.display = 'block';
        btnCerrar.style.display = 'none';
    }
}

function actualizarContador() {
    let textarea = document.getElementById('p-content');
    let counter = document.getElementById('char-counter');
    if (!textarea || !counter) return;
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
        
        if (userDisplay) userDisplay.innerHTML = obtenerBadgeUser(username);

        let pUser = document.getElementById('profile-username');
        let pEmail = document.getElementById('profile-email');
        let pId = document.getElementById('profile-id');
        let pLogin = document.getElementById('profile-last-login');

        if (pUser) pUser.innerHTML = obtenerBadgeUser(username);
        if (pEmail) pEmail.innerText = currentUserEmail;
        if (pId) pId.innerText = session.user.id;
        if (pLogin && session.user.last_sign_in_at) {
            pLogin.innerText = new Date(session.user.last_sign_in_at).toLocaleString();
        }

        if (authBox) authBox.style.display = 'none';
        if (postBox) postBox.style.display = 'block';
        if (navLoginBtn) navLoginBtn.innerText = `[ur/${username}]`;

        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    } else {
        currentUserEmail = '';
        if (authBox) authBox.style.display = 'block';
        if (postBox) postBox.style.display = 'none';
        if (navLoginBtn) navLoginBtn.innerText = '[Login]';
        let statusMsg = document.getElementById('status-msg');
        if (statusMsg) statusMsg.innerText = '';
    }
}

function focusLogin() {
    if (currentUserEmail) {
        let perfilDiv = document.getElementById('tab-perfil');
        let pubDiv = document.getElementById('tab-publicar');
        let btnCerrar = document.getElementById('btn-cerrar-post');
        
        if (pubDiv) pubDiv.style.display = 'none';
        if (btnCerrar) btnCerrar.style.display = 'none';
        if (perfilDiv) perfilDiv.style.display = perfilDiv.style.display === 'none' ? 'block' : 'none';
    } else {
        let emailInput = document.getElementById('email');
        if (emailInput) emailInput.focus();
    }
}

async function enviarPost() {
    let subForumSelect = document.getElementById('p-subratita').value;
    let content = document.getElementById('p-content').value.trim();
    let captchaInput = document.getElementById('captcha-respuesta');
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

    // Validación del CAPTCHA matemático
    if (!captchaInput || parseInt(captchaInput.value.trim()) !== captchaResultadoCorrecto) {
        status.style.color = 'red';
        status.innerText = "CAPTCHA incorrecto. ¡Resuelve bien la suma!";
        generarCaptcha();
        if (captchaInput) captchaInput.focus();
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
        if (captchaInput) captchaInput.value = '';
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
    if (!input) return;
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
    if (!text) return '';
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

function copiarLinkPost(postId) {
    let urlBase = window.location.origin + window.location.pathname;
    let link = `${urlBase}#post-${postId}`;
    
    navigator.clipboard.writeText(link).then(() => {
        alert(`¡Enlace copiado al portapapeles!\n${link}`);
    }).catch(err => {
        alert("Error al copiar enlace.");
    });
}

function filtrarPorSubratita(sub, actualizarHash = true) {
    currentSubratitaFiltro = sub;
    
    if (actualizarHash) {
        if (sub === 'todos') {
            history.pushState(null, null, ' ');
        } else {
            window.location.hash = `sr/${sub}`;
        }
    }

    renderFeed(allPostsData, allCommentsData);
    actualizarNavSubratitas();
}

function leerSubratitaDesdeURL() {
    let hash = window.location.hash.replace('#', '');
    if (hash.startsWith('sr/')) {
        let sub = hash.replace('sr/', '');
        currentSubratitaFiltro = sub;
    } else if (hash.startsWith('post-')) {
        currentSubratitaFiltro = 'todos';
    }
}

function resaltarPostCompartido() {
    let hash = window.location.hash;
    if (hash.startsWith('#post-')) {
        let el = document.querySelector(hash);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight-post');
            
            setTimeout(() => {
                el.classList.remove('highlight-post');
            }, 3500);
        }
    }
}

function filtrarPosts() {
    renderFeed(allPostsData, allCommentsData);
}

async function cargarPosts() {
    let feed = document.getElementById('feed');
    if (!feed) return;

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
        let misPostIds = posts.filter(p => p && p.username === currentUsername).map(p => p.id);
        
        let ultimosComentarios = nuevosComentarios.slice(knownCommentsCount);
        ultimosComentarios.forEach(c => {
            if (c && misPostIds.includes(c.post_ID) && c.username !== currentUsername) {
                let textSnippet = (c.content || '').substring(0, 40);
                enviarNotificacionCelular(
                    `¡Nueva respuesta en NiñosRata.com!`,
                    `ur/${c.username} te respondió: "${textSnippet}..."`
                );
            }
        });
    }

    knownCommentsCount = nuevosComentarios.length;
    allPostsData = posts;
    allCommentsData = nuevosComentarios;

    leerSubratitaDesdeURL();
    actualizarNavSubratitas();
    renderFeed(allPostsData, allCommentsData);
    resaltarPostCompartido();
}

function actualizarNavSubratitas() {
    let navDiv = document.getElementById('subratitas-nav');
    if (!navDiv) return;

    let subsUnicas = [...new Set(allPostsData.map(p => p && (p.SubForum || p.subforum) ? (p.SubForum || p.subforum) : 'general'))];
    
    let html = `<button class="btn-chan ${currentSubratitaFiltro === 'todos' ? 'active-sub' : ''}" onclick="filtrarPorSubratita('todos')">[Todos]</button>`;
    
    subsUnicas.forEach(sub => {
        let activeClass = currentSubratitaFiltro === sub ? 'active-sub' : '';
        html += `<button class="btn-chan ${activeClass}" onclick="filtrarPorSubratita('${sub}')">[sr/${sub}]</button>`;
    });

    navDiv.innerHTML = html;
}

function renderFeed(posts, comentarios) {
    let feed = document.getElementById('feed');
    if (!feed) return;

    let currentUsername = currentUserEmail ? currentUserEmail.split('@')[0] : '';
    let searchInput = document.getElementById('search-input');
    let searchQuery = searchInput && searchInput.value ? searchInput.value.toLowerCase().trim() : '';

    let filtrados = posts.filter(p => {
        if (!p) return false;
        let pSub = p.SubForum || p.subforum || 'general';
        let subMatches = currentSubratitaFiltro === 'todos' || pSub === currentSubratitaFiltro;
        
        let uname = (p.username || '').toLowerCase();
        let pContent = (p.content || '').toLowerCase();
        let subNameStr = pSub.toLowerCase();

        let searchMatches = !searchQuery || uname.includes(searchQuery) || pContent.includes(searchQuery) || subNameStr.includes(searchQuery);
        return subMatches && searchMatches;
    });

    if (!filtrados || filtrados.length === 0) {
        feed.innerHTML = `<div style="text-align:center; font-size:11px;">No se encontraron publicaciones en este SR.</div>`;
        return;
    }

    feed.innerHTML = '';
    filtrados.forEach(p => {
        let fecha = p.created_at ? new Date(p.created_at).toLocaleString() : 'Fecha desconocida';
        let subName = p.SubForum || p.subforum || 'general';
        let misComentarios = comentarios ? comentarios.filter(c => c && c.post_ID === p.id) : [];
        let commentsHTML = '';

        misComentarios.forEach(c => {
            let cFecha = c.created_at ? new Date(c.created_at).toLocaleString() : '';
            let cUser = c.username || 'Anónimo';
            let esMiComentario = currentUsername && currentUsername === cUser;
            let deleteCommentBtn = esMiComentario ? `<span class="delete-btn" onclick="borrarComentario(${c.id})">[Borrar]</span>` : '';

            commentsHTML += `
                <div class="comment-card">
                    ${obtenerBadgeUser(cUser)}
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

        let pUser = p.username || 'Anónimo';
        let esMiPost = currentUsername && currentUsername === pUser;
        let deletePostBtn = esMiPost ? `<span class="delete-btn" onclick="borrarPost(${p.id})">[Borrar]</span>` : '';

        feed.innerHTML += `
            <div class="post-card" id="post-${p.id}">
                <div class="post-header">
                    ${obtenerBadgeUser(pUser)}
                    <span style="color: #004400; font-weight: bold; cursor: pointer;" onclick="filtrarPorSubratita('${subName}')">sr/${subName}</span>
                    <span>${fecha}</span>
                    <span style="float:right;">No. ${p.id}</span>
                </div>
                <div class="message">${formatMessage(p.content)}</div>

                <span class="reply-btn" onclick="toggleReplyBox(${p.id})">[Responder]</span> (${misComentarios.length} comentarios)
                <span class="reply-btn" style="color:#006600; margin-left:6px;" onclick="copiarLinkPost(${p.id})">[Compartir]</span>
                ${deletePostBtn}

                ${replyFormHTML}

                <div class="comments-section">
                    ${commentsHTML}
                </div>
            </div>
        `;
    });
}

window.addEventListener('hashchange', () => {
    leerSubratitaDesdeURL();
    renderFeed(allPostsData, allCommentsData);
    actualizarNavSubratitas();
    resaltarPostCompartido();
});

checkSession();
cargarBorrador();
cargarPosts();

setInterval(() => {
    cargarPosts();
}, 15000);
