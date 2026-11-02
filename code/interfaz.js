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
        if (perfilDiv) perfilDiv.style.display = perfilDiv.style.display === 'none' ? 'block' : 'none';
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
        let el = document.querySelector(hash);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight-post');
            setTimeout(() => el.classList.remove('highlight-post'), 3500);
        }
    }
}

function filtrarPorSubratita(sub, actualizarHash = true) {
    currentSubratitaFiltro = sub;
    if (actualizarHash) {
        if (sub === 'todos') history.pushState(null, null, ' ');
        else window.location.hash = `sr/${sub}`;
    }
    renderFeed(allPostsData, allCommentsData);
    actualizarNavSubratitas();
}

function leerSubratitaDesdeURL() {
    let hash = window.location.hash.replace('#', '');
    if (hash.startsWith('sr/')) {
        currentSubratitaFiltro = hash.replace('sr/', '');
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
        feed.innerHTML = `<div style="text-align:center; font-size:11px;">No se encontraron publicaciones.</div>`;
        return;
    }

    feed.innerHTML = '';
    filtrados.forEach(p => {
        let fecha = p.created_at ? new Date(p.created_at).toLocaleString() : 'Fecha desconocida';
        let subName = p.SubForum || p.subforum || 'general';
        let totalLikes = p.likes || 0;
        let misComentarios = comentarios ? comentarios.filter(c => c && c.post_ID === p.id) : [];
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
                    <div style="margin-top:2px;">${formatMessage(c.content)}</div>
                </div>
            `;
        });

        let replyFormHTML = currentUserEmail ? `
            <div id="reply-form-${p.id}" style="display:none; margin-top:8px;">
                <input type="text" id="comment-input-${p.id}" maxlength="500" placeholder="Respuesta..." style="width:70%;">
                <button class="btn-chan" onclick="enviarComentario(${p.id})">Enviar</button>
            </div>
        ` : `<div style="font-size:10px; color:#666; margin-top:5px;">(Inicia sesión para responder)</div>`;

        let deletePostBtn = (currentUsername && currentUsername === (p.username || 'Anónimo')) ? `<span class="delete-btn" onclick="borrarPost(${p.id})">[Borrar]</span>` : '';

        feed.innerHTML += `
            <div class="post-card" id="post-${p.id}">
                <div class="post-header">
                    ${obtenerBadgeUser(p.username || 'Anónimo')}
                    <span style="color: #004400; font-weight: bold; cursor: pointer;" onclick="filtrarPorSubratita('${subName}')">sr/${subName}</span>
                    <span>${fecha}</span>
                    <span style="float:right;">No. ${p.id}</span>
                </div>
                <div class="message">${formatMessage(p.content)}</div>
                
                <span class="reply-btn" onclick="toggleReplyBox(${p.id})">[Responder]</span> (${misComentarios.length})
                <span class="reply-btn" style="color:#006600; margin-left:6px;" onclick="copiarLinkPost(${p.id})">[Compartir]</span>
                <span class="reply-btn" style="color:#b35900; margin-left:6px; display:inline-flex; align-items:center; cursor:pointer;" onclick="darLike(${p.id})">
                    <img src="assets/ui/like.png" alt="Like" style="height:14px; vertical-align:middle; margin-right:2px;" onerror="this.style.display='none'"> [Basado] (${totalLikes})
                </span>
                ${deletePostBtn}
                
                ${replyFormHTML}
                <div class="comments-section">${commentsHTML}</div>
            </div>
        `;
    });
}
