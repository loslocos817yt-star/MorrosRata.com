let postActualId = null;

function escapeHtml(text) {
    return text ? text.replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t])) : '';
}

function obtenerBadgeUser(username) {
    let cleanUser = escapeHtml(username);
    if (ADMIN_USERS.includes(username)) {
        return `<span class="postername">ur/${cleanUser}</span> <img src="assets/web/admin.log.png" alt="Admin" style="height: 18px; vertical-align: middle; margin: 0 4px;" title="Admin">`;
    }
    return `<span class="postername">ur/${cleanUser}</span>`;
}

function inyectarEditorNombre(nombreActual) {
    if (document.getElementById('edit-username-box')) {
        let inp = document.getElementById('edit-username-input');
        if (inp) inp.value = nombreActual;
        return;
    }

    let perfilDiv = document.getElementById('tab-perfil');
    let pUser = document.getElementById('profile-username');
    let contenedor = pUser ? pUser.parentElement : perfilDiv;
    if (!contenedor) return;

    let box = document.createElement('div');
    box.id = 'edit-username-box';
    box.style.cssText = 'margin-top: 8px; padding: 6px; border-top: 1px dashed #999; font-size: 11px;';
    box.innerHTML = `
        <label for="edit-username-input" style="font-weight: bold;">Cambiar nombre:</label><br>
        <input type="text" id="edit-username-input" maxlength="20" value="${escapeHtml(nombreActual)}" placeholder="Nuevo nombre..." style="margin-top: 4px; width: 65%; font-family: monospace; font-size: 11px;">
        <button type="button" class="btn-chan" onclick="guardarNuevoNombre()" style="margin-left: 4px;">[Guardar]</button>
        <div id="edit-name-status" style="margin-top: 4px; font-size: 10px;"></div>
    `;
    contenedor.appendChild(box);
}

function solicitarPermisoNotificaciones() {
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                alert("¡Notificaciones activadas!");
            } else if (permission === "denied") {
                alert("Notificaciones bloqueadas.");
            }
        });
    } else {
        alert("Tu navegador no soporta notificaciones.");
    }
}

function enviarNotificacionCelular(titulo, mensaje) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(titulo, { body: mensaje, icon: 'assets/web/favicon.png' });
    }
}

function togglePublishBox() {
    let pubDiv = document.getElementById('tab-publicar');
    let perfilDiv = document.getElementById('tab-perfil');
    let btnCerrar = document.getElementById('btn-cerrar-post');
    if (perfilDiv) perfilDiv.style.display = 'none';
    if (pubDiv.style.display === 'none' || pubDiv.style.display === '') {
        pubDiv.style.display = 'block';
        if (btnCerrar) btnCerrar.style.display = 'inline-block';
        let subInput = document.getElementById('p-subratita');
        if (subInput) subInput.focus();
    } else {
        pubDiv.style.display = 'none';
        if (btnCerrar) btnCerrar.style.display = 'none';
    }
}

function cerrarCajaPost() {
    let pubDiv = document.getElementById('tab-publicar');
    let perfilDiv = document.getElementById('tab-perfil');
    let btnCerrar = document.getElementById('btn-cerrar-post');
    if (pubDiv) pubDiv.style.display = 'none';
    if (perfilDiv) perfilDiv.style.display = 'none';
    if (btnCerrar) btnCerrar.style.display = 'none';
}

function verTab(tabName) {
    let pubDiv = document.getElementById('tab-publicar');
    let perfilDiv = document.getElementById('tab-perfil');
    let btnCerrar = document.getElementById('btn-cerrar-post');
    if (tabName === 'publicar') {
        if (pubDiv) pubDiv.style.display = 'block';
        if (perfilDiv) perfilDiv.style.display = 'none';
        if (btnCerrar) btnCerrar.style.display = 'inline-block';
    } else {
        if (pubDiv) pubDiv.style.display = 'none';
        if (perfilDiv) perfilDiv.style.display = 'block';
        if (btnCerrar) btnCerrar.style.display = 'none';
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

function focusLogin() {
    if (currentUserEmail) {
        let perfilDiv = document.getElementById('tab-perfil');
        let pubDiv = document.getElementById('tab-publicar');
        let btnCerrar = document.getElementById('btn-cerrar-post');
        if (pubDiv) pubDiv.style.display = 'none';
        if (btnCerrar) btnCerrar.style.display = 'none';
        if (perfilDiv) {
            perfilDiv.style.display = perfilDiv.style.display === 'none' ? 'block' : 'none';
            if (perfilDiv.style.display === 'block') {
                inyectarEditorNombre(obtenerNombreActivo());
            }
        }
    } else {
        let emailInput = document.getElementById('email');
        if (emailInput) emailInput.focus();
    }
}

function formatMessage(text) {
    if (!text) return '';
    let escaped = escapeHtml(text);
    return escaped.split('\n').map(line => {
        if (line.trim().startsWith('&gt;')) return `<span class="greentext">${line}</span>`;
        return line;
    }).join('<br>');
}

function copiarLinkPost(postId) {
    let link = `${window.location.origin}${window.location.pathname}#post-${postId}`;
    navigator.clipboard.writeText(link).then(() => {
        alert(`¡Enlace copiado!\n${link}`);
    }).catch(() => alert("Error al copiar enlace."));
}

function resaltarPostCompartido() {
    let hash = window.location.hash;
    if (hash.startsWith('#post-')) {
        let postId = hash.replace('#post-', '');
        abrirTema(postId, false);
    }
}

function filtrarPorSubratita(sub, actualizarHash = true) {
    postActualId = null;
    currentSubratitaFiltro = sub;
    if (actualizarHash) {
        if (sub === 'todos') {
            history.pushState({view: 'feed', sub: 'todos'}, '', window.location.pathname);
        } else {
            history.pushState({view: 'feed', sub: sub}, '', `#sr/${sub}`);
        }
    }
    renderFeed(allPostsData, allCommentsData);
    actualizarNavSubratitas();
}

function leerSubratitaDesdeURL() {
    let hash = window.location.hash.replace('#', '');
    if (hash.startsWith('sr/')) {
        currentSubratitaFiltro = hash.replace('sr/', '');
    } else if (hash.startsWith('post-')) {
        let postId = hash.replace('post-', '');
        postActualId = parseInt(postId) || postId;
    }
}

function filtrarPosts() {
    if (postActualId) return;
    renderFeed(allPostsData, allCommentsData);
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

function renderizarContadorVisitas(visitas) {
    let numStr = String(visitas || 0);
    while (numStr.length < 4) {
        numStr = '0' + numStr;
    }
    let htmlDigitos = '';
    for (let i = 0; i < numStr.length; i++) {
        let digito = numStr[i];
        htmlDigitos += `<img src="assets/ui/numeros/${digito}.png" alt="${digito}" style="width: 14px; height: 20px; image-rendering: pixelated; image-rendering: crisp-edges; vertical-align: middle; margin-right: 1px;">`;
    }
    return `
        <div style="display: inline-flex; align-items: center; background: #111; padding: 3px 6px; border: 2px solid #444; box-shadow: inset 1px 1px 3px #000; border-radius: 2px;">
            <span style="font-size: 9px; color: #00ff66; margin-right: 5px; font-family: monospace; font-weight: bold;">VISITAS:</span>
            ${htmlDigitos}
        </div>
    `;
}

async function abrirTema(postId, pushHistory = true) {
    postActualId = postId;
    if (pushHistory) {
        history.pushState({view: 'post', id: postId}, '', `#post-${postId}`);
    }

    try {
        let postObj = allPostsData.find(p => p.id == postId);
        if (postObj) {
            let currentViews = (postObj.views || 0) + 1;
            postObj.views = currentViews;
            
            let { error } = await supabaseClient
                .from('jodidosPOST')
                .update({ views: currentViews })
                .eq('id', postId);

            if (error) {
                console.log("Error al actualizar vistas en Supabase:", error.message);
            }
        }
    } catch (err) {
        console.log("Excepción al sumar vista:", err);
    }

    renderFeed(allPostsData, allCommentsData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function volverAlFeed() {
    postActualId = null;
    let targetHash = currentSubratitaFiltro === 'todos' ? window.location.pathname : `#sr/${currentSubratitaFiltro}`;
    history.pushState({view: 'feed', sub: currentSubratitaFiltro}, '', targetHash);
    renderFeed(allPostsData, allCommentsData);
}

window.addEventListener('popstate', (event) => {
    let hash = window.location.hash;
    if (hash.startsWith('#post-')) {
        let postId = hash.replace('#post-', '');
        postActualId = parseInt(postId) || postId;
    } else {
        postActualId = null;
        if (hash.startsWith('#sr/')) {
            currentSubratitaFiltro = hash.replace('#sr/', '');
        } else {
            currentSubratitaFiltro = 'todos';
        }
    }
    renderFeed(allPostsData, allCommentsData);
});

function renderFeed(posts, comentarios) {
    let feed = document.getElementById('feed');
    if (!feed) return;
    let currentUsername = currentUserEmail ? obtenerNombreActivo() : '';

    if (postActualId !== null) {
        let post = posts.find(p => p && p.id == postActualId);
        if (!post) {
            feed.innerHTML = `<div style="text-align:center; font-size:11px; padding: 20px;">El hilo no existe o fue borrado. <br><br><button class="btn-chan" onclick="volverAlFeed()">[← Volver al Índice]</button></div>`;
            return;
        }

        let fecha = post.created_at ? new Date(post.created_at).toLocaleString() : 'Fecha desconocida';
        let subName = post.SubForum || post.subforum || 'general';
        let totalLikes = post.likes || 0;
        let totalViews = post.views || 0;
        let misComentarios = comentarios ? comentarios.filter(c => c && c.post_ID == post.id) : [];
        let commentsHTML = '';

        misComentarios.forEach(c => {
            let cFecha = c.created_at ? new Date(c.created_at).toLocaleString() : '';
            let cUser = c.username || 'Anónimo';
            let deleteCommentBtn = (currentUsername && currentUsername === cUser) ? `<span class="delete-btn" onclick="borrarComentario(${c.id})">[Borrar]</span>` : '';
            commentsHTML += `
                <div class="comment-card">
                    ${obtenerBadgeUser(cUser)}
                    <span style="color:#666; font-size:10px;">${cFecha}</span>
                    ${deleteCommentBtn}
                    <div style="margin-top:4px;">${formatMessage(c.content)}</div>
                </div>
            `;
        });

        let replyFormHTML = currentUserEmail ? `
            <div style="margin-top: 12px; background: #eef2f7; padding: 10px; border: 1px solid #b0c4de;">
                <div style="font-weight: bold; margin-bottom: 5px; font-size: 11px; color: #004d00;">Escribir respuesta en este hilo:</div>
                <textarea id="comment-input-${post.id}" rows="3" maxlength="500" placeholder="Escribe tu respuesta..." style="width:96%; font-family:monospace; font-size:11px; padding:6px;"></textarea>
                <div style="text-align: right; margin-top: 5px;">
                    <button class="btn-chan" onclick="enviarComentario(${post.id})">Enviar Respuesta</button>
                </div>
            </div>
        ` : `<div style="font-size:11px; color:#666; margin-top:10px; text-align:center;">(Inicia sesión para poder responder en este hilo)</div>`;

        let deletePostBtn = (currentUsername && currentUsername === (post.username || 'Anónimo')) ? `<span class="delete-btn" onclick="borrarPost(${post.id})">[Borrar Tema]</span>` : '';

        feed.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #d8e6d8; padding: 6px 10px; margin-bottom: 10px; border: 1px solid #b0c9b0;">
                <a onclick="volverAlFeed()" style="cursor: pointer; color: #004d00; font-weight: bold; font-size: 11px;">← Volver al tablón (sr/${subName})</a>
                <div>${renderizarContadorVisitas(totalViews)}</div>
            </div>

            <div class="post-card" id="post-${post.id}" style="border: 2px solid #2b5c2b;">
                <div class="post-header" style="font-weight: bold;">
                    ${obtenerBadgeUser(post.username || 'Anónimo')}
                    <span style="color: #004400;">sr/${subName}</span>
                    <span>${fecha}</span>
                    <span style="float:right;">No. ${post.id}</span>
                </div>
                <div class="message" style="margin-top: 8px;">${formatMessage(post.content)}</div>
                
                <div style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 6px; display: flex; gap: 10px; align-items: center;">
                    <span class="reply-btn" style="color:#b35900; display:inline-flex; align-items:center; cursor:pointer;" onclick="darLike(${post.id})">
                        <img src="assets/ui/like.png" alt="Like" style="height:14px; vertical-align:middle; margin-right:2px;" onerror="this.style.display='none'"> [Basado] (${totalLikes})
                    </span>
                    <span class="reply-btn" style="color:#006600;" onclick="copiarLinkPost(${post.id})">[Compartir Link]</span>
                    ${deletePostBtn}
                </div>
            </div>

            <div style="margin: 15px 0 8px 0; font-size: 12px; font-weight: bold; color: #004d00; border-bottom: 2px solid #2b5c2b; padding-bottom: 3px;">
                💬 Comentarios (${misComentarios.length})
            </div>

            <div class="comments-section" style="margin-left: 0;">
                ${commentsHTML.length > 0 ? commentsHTML : `<div style="font-size:11px; color:#666; padding: 10px; text-align: center;">No hay comentarios todavía. ¡Sé el primero en contestar!</div>`}
            </div>

            ${replyFormHTML}
        `;
        return;
    }

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
        feed.innerHTML = `<div style="text-align:center; font-size:11px; padding: 20px;">No se encontraron publicaciones en este SubForum.</div>`;
        return;
    }

    feed.innerHTML = '';
    filtrados.forEach(p => {
        let fecha = p.created_at ? new Date(p.created_at).toLocaleString() : 'Fecha desconocida';
        let subName = p.SubForum || p.subforum || 'general';
        let totalLikes = p.likes || 0;
        let totalViews = p.views || 0;
        let misComentarios = comentarios ? comentarios.filter(c => c && c.post_ID == p.id) : [];

        feed.innerHTML += `
            <div class="post-card" id="post-${p.id}">
                <div class="post-header">
                    ${obtenerBadgeUser(p.username || 'Anónimo')}
                    <span style="color: #004400; font-weight: bold; cursor: pointer;" onclick="filtrarPorSubratita('${subName}')">sr/${subName}</span>
                    <span>${fecha}</span>
                    <span style="float:right;">No. ${p.id}</span>
                </div>
                
                <div class="message">${formatMessage(p.content)}</div>
                
                <div style="font-size: 11px; margin-top: 8px; display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #ddd; padding-top: 6px;">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span class="reply-btn" onclick="abrirTema(${p.id})" style="font-weight: bold; color: #0033aa;">[Ver Comentarios (${misComentarios.length})]</span>
                        <span class="reply-btn" style="color:#b35900; display:inline-flex; align-items:center; cursor:pointer;" onclick="darLike(${p.id})">
                            <img src="assets/ui/like.png" alt="Like" style="height:14px; vertical-align:middle; margin-right:2px;" onerror="this.style.display='none'"> [Basado] (${totalLikes})
                        </span>
                        <span class="reply-btn" style="color:#006600;" onclick="copiarLinkPost(${p.id})">[Compartir]</span>
                    </div>
                    <div style="font-size: 10px; color: #555;">
                        👁️ ${totalViews} visitas
                    </div>
                </div>
            </div>
        `;
    });
}

function toggleMenuTresPuntitos(event) {
    if (event) event.stopPropagation();
    let menu = document.getElementById('dropdown-menu-puntitos');
    if (menu) {
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
    }
}

document.addEventListener('click', function(e) {
    let menu = document.getElementById('dropdown-menu-puntitos');
    let btn = e.target.closest('button[onclick*="toggleMenuTresPuntitos"]');
    if (menu && !menu.contains(e.target) && !btn) {
        menu.style.display = 'none';
    }
});

function cambiarTema(nombreTema) {
    document.body.className = `theme-${nombreTema}`;
    localStorage.setItem('ninosrata_theme', nombreTema);
    let menu = document.getElementById('dropdown-menu-puntitos');
    if (menu) menu.style.display = 'none';
}

window.addEventListener('DOMContentLoaded', () => {
    let savedTheme = localStorage.getItem('ninosrata_theme') || 'original';
    document.body.className = `theme-${savedTheme}`;
});
