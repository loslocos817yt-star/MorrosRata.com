// ============================================================
// post.js — Publicaciones, comentarios, SubRatitas, feed e inicialización
// Debe cargarse DESPUÉS de main.js
// ============================================================

let allPostsData = [];
let allCommentsData = [];
let currentSubratitaFiltro = 'todos';
let knownCommentsCount = 0;

// ---------- Publicaciones ----------

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

// ---------- Comentarios ----------

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

// ---------- Formato y compartir ----------

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

function copiarLinkPost(postId) {
    let urlBase = window.location.origin + window.location.pathname;
    let link = `${urlBase}#post-${postId}`;
    
    navigator.clipboard.writeText(link).then(() => {
        alert(`¡Enlace copiado al portapapeles!\n${link}`);
    }).catch(err => {
        alert("Error al copiar enlace.");
    });
}

function resaltarPostCompartido() {
    let hash = window.location.hash;
    if (hash.startsWith('#post-')) {
        let el = document.querySelector(hash);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight-post');
            
            // Remueve la animación de resaltado después de 3.5 segundos
            setTimeout(() => {
                el.classList.remove('highlight-post');
            }, 3500);
        }
    }
}

// ---------- SubRatitas / filtros ----------

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

function filtrarPosts() {
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

// ---------- Carga y render del feed ----------

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

    leerSubratitaDesdeURL();
    actualizarNavSubratitas();
    renderFeed(allPostsData, allCommentsData);
    resaltarPostCompartido();
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
            <div class="post-card" id="post-${p.id}">
                <div class="post-header">
                    ${obtenerBadgeUser(p.username)}
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

// ---------- Inicialización ----------

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