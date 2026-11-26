let postActualId = null;
const REACCIONES = [
    {f:'XD.png',l:'XD'},
    {f:'no.png',l:'No'},
    {f:'si.png',l:'Sí'},
    {f:'trollface.png',l:'Troll'}
];
const esc = s => s ? s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])) : '';
const $ = id => document.getElementById(id);

function obtenerBadgeUser(u) {
    let cu = esc(u);
    let badge = ADMIN_USERS.includes(u) ? ` <img src="assets/web/admin.log.png" alt="Admin" style="height:18px;vertical-align:middle;margin:0 4px">` : '';
    return `<span class="postername">ur/${cu}</span>${badge}`;
}

function insertarTagImagen(postId, fileName) {
    let ta = $(`comment-input-${postId}`);
    if (!ta) return;
    let tag = `{Imagen=${fileName}}`;
    let sep = ta.value && !ta.value.endsWith('\n') && !ta.value.endsWith(' ') ? '\n' : '';
    ta.value = `${ta.value}${sep}${tag}`;
    ta.focus();
}

function pintSelResp(postId) {
    let c = $('selector-respuestas-img');
    if (!c) return;
    let btns = REACCIONES.map(r => `<button type="button" onclick="insertarTagImagen(${postId},'${r.f}')" style="display:inline-flex;flex-direction:column;align-items:center;padding:3px;cursor:pointer;border:1px solid #888;background:#fff;border-radius:2px"><img src="assets/respuestas/${r.f}" alt="${r.l}" style="width:34px;height:34px;object-fit:cover"><span style="font-size:9px;font-family:monospace">${r.l}</span></button>`).join('');
    c.innerHTML = `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">${btns}</div><div style="margin-top:4px;font-size:10px;color:#555;font-family:monospace">Toca para insertar <b>{Imagen=archivo.png}</b></div>`;
}

function inyectarEditorNombre(actual) {
    let inp = $('edit-username-input');
    if (inp) { inp.value = actual; return; }
    let cont = $('profile-username') ? $('profile-username').parentElement : $('tab-perfil');
    if (!cont) return;
    let d = document.createElement('div');
    d.id = 'edit-username-box';
    d.style.cssText = 'margin-top:8px;padding:6px;border-top:1px dashed #999;font-size:11px';
    d.innerHTML = `<label for="edit-username-input" style="font-weight:bold">Cambiar nombre:</label><br><input type="text" id="edit-username-input" maxlength="20" value="${esc(actual)}" style="margin-top:4px;width:65%;font-family:monospace;font-size:11px"><button type="button" class="btn-chan" onclick="guardarNuevoNombre()" style="margin-left:4px">[Guardar]</button><div id="edit-name-status" style="margin-top:4px;font-size:10px"></div>`;
    cont.appendChild(d);
}

function solicitarPermisoNotificaciones() {
    if (!("Notification" in window)) return alert("Tu navegador no soporta notificaciones.");
    Notification.requestPermission().then(p => alert(p === "granted" ? "¡Notificaciones activadas!" : p === "denied" ? "Notificaciones bloqueadas." : "Pendiente."));
}

function enviarNotificacionCelular(t, m) {
    if ("Notification" in window && Notification.permission === "granted") new Notification(t, { body: m, icon: 'assets/web/favicon.png' });
}

function togglePublishBox() {
    let pub = $('tab-publicar'), per = $('tab-perfil'), btn = $('btn-cerrar-post');
    if (per) per.style.display = 'none';
    let open = pub.style.display === 'none' || pub.style.display === '';
    pub.style.display = open ? 'block' : 'none';
    if (btn) btn.style.display = open ? 'inline-block' : 'none';
    if (open && $('p-subratita')) $('p-subratita').focus();
}

function cerrarCajaPost() {
    ['tab-publicar', 'tab-perfil', 'btn-cerrar-post'].forEach(id => { if ($(id)) $(id).style.display = 'none'; });
}

function verTab(tab) {
    let esPub = tab === 'publicar';
    if ($('tab-publicar')) $('tab-publicar').style.display = esPub ? 'block' : 'none';
    if ($('tab-perfil')) $('tab-perfil').style.display = esPub ? 'none' : 'block';
    if ($('btn-cerrar-post')) $('btn-cerrar-post').style.display = esPub ? 'inline-block' : 'none';
}

function actualizarContador() {
    let ta = $('p-content'), cnt = $('char-counter');
    if (!ta || !cnt) return;
    cnt.innerText = `${500 - ta.value.length} / 500`;
    localStorage.setItem('norros_draft', ta.value);
}

function cargarBorrador() {
    let s = localStorage.getItem('norros_draft'), ta = $('p-content');
    if (s && ta) { ta.value = s; actualizarContador(); }
}

function focusLogin() {
    if (!currentUserEmail) return $('email') && $('email').focus();
    let per = $('tab-perfil'), pub = $('tab-publicar'), btn = $('btn-cerrar-post');
    if (pub) pub.style.display = 'none';
    if (btn) btn.style.display = 'none';
    if (per) {
        per.style.display = per.style.display === 'none' ? 'block' : 'none';
        if (per.style.display === 'block') inyectarEditorNombre(obtenerNombreActivo());
    }
}

function formatMessage(txt) {
    if (!txt) return '';
    let ok = REACCIONES.map(r => r.f);
    let out = esc(txt).replace(/\{Imagen=([a-zA-Z0-9._-]+)\}/g, (full, fn) =>
        ok.includes(fn) ? `<img src="assets/respuestas/${fn}" alt="${esc(fn)}" style="max-width:120px;max-height:120px;border:1px solid #555;vertical-align:middle;margin:3px 2px">` : full
    );
    return out.split('\n').map(l => l.trim().startsWith('&gt;') ? `<span class="greentext">${l}</span>` : l).join('<br>');
}

function copiarLinkPost(id) {
    let link = `${location.origin}${location.pathname}#post-${id}`;
    navigator.clipboard.writeText(link).then(() => alert(`¡Enlace copiado!\n${link}`)).catch(() => alert("Error al copiar enlace."));
}

function resaltarPostCompartido() {
    if (location.hash.startsWith('#post-')) abrirTema(location.hash.replace('#post-', ''), false);
}

function filtrarPorSubratita(sub, push = true) {
    postActualId = null;
    currentSubratitaFiltro = sub;
    if (push) history.pushState({view:'feed',sub}, '', sub === 'todos' ? location.pathname : `#sr/${sub}`);
    renderFeed(allPostsData, allCommentsData);
    actualizarNavSubratitas();
}

function leerSubratitaDesdeURL() {
    let h = location.hash.replace('#', '');
    if (h.startsWith('sr/')) currentSubratitaFiltro = h.replace('sr/', '');
    else if (h.startsWith('post-')) { let id = h.replace('post-', ''); postActualId = parseInt(id) || id; }
}

function filtrarPosts() { if (!postActualId) renderFeed(allPostsData, allCommentsData); }

function actualizarNavSubratitas() {
    let nav = $('subratitas-nav');
    if (!nav) return;
    let subs = [...new Set(allPostsData.map(p => p && (p.SubForum || p.subforum) || 'general'))];
    nav.innerHTML = `<button class="btn-chan ${currentSubratitaFiltro==='todos'?'active-sub':''}" onclick="filtrarPorSubratita('todos')">[Todos]</button>` +
        subs.map(s => `<button class="btn-chan ${currentSubratitaFiltro===s?'active-sub':''}" onclick="filtrarPorSubratita('${s}')">[sr/${s}]</button>`).join('');
}

function renderizarContadorVisitas(v) {
    let s = String(v || 0).padStart(4, '0');
    let imgs = [...s].map(d => `<img src="assets/ui/numeros/${d}.png" alt="${d}" style="width:14px;height:20px;image-rendering:pixelated;vertical-align:middle;margin-right:1px">`).join('');
    return `<div style="display:inline-flex;align-items:center;background:#111;padding:3px 6px;border:2px solid #444;border-radius:2px"><span style="font-size:9px;color:#0f6;margin-right:5px;font-family:monospace;font-weight:bold">VISITAS:</span>${imgs}</div>`;
}

async function abrirTema(id, push = true) {
    postActualId = id;
    if (push) history.pushState({view:'post',id}, '', `#post-${id}`);
    try {
        let p = allPostsData.find(x => x.id == id);
        if (p) {
            let v = (p.views || 0) + 1;
            p.views = v;
            let { error } = await supabaseClient.from('jodidosPOST').update({ views: v }).eq('id', id);
            if (error) console.log("Error views:", error.message);
        }
    } catch (e) {}
    renderFeed(allPostsData, allCommentsData);
    scrollTo({ top: 0, behavior: 'smooth' });
}

function volverAlFeed() {
    postActualId = null;
    history.pushState({view:'feed',sub:currentSubratitaFiltro}, '', currentSubratitaFiltro === 'todos' ? location.pathname : `#sr/${currentSubratitaFiltro}`);
    renderFeed(allPostsData, allCommentsData);
}

addEventListener('popstate', () => {
    let h = location.hash;
    if (h.startsWith('#post-')) { let id = h.replace('#post-', ''); postActualId = parseInt(id) || id; }
    else { postActualId = null; currentSubratitaFiltro = h.startsWith('#sr/') ? h.replace('#sr/', '') : 'todos'; }
    renderFeed(allPostsData, allCommentsData);
});

const likeBtn = id => `<span class="reply-btn" style="color:#b35900;display:inline-flex;align-items:center;cursor:pointer" onclick="darLike(${id})"><img src="assets/ui/like.png" alt="Like" style="height:14px;vertical-align:middle;margin-right:2px" onerror="this.style.display='none'">[Basado]</span>`;

function renderFeed(posts, comentarios) {
    let feed = $('feed');
    if (!feed) return;
    let me = currentUserEmail ? obtenerNombreActivo() : '';

    if (postActualId !== null) {
        let p = posts.find(x => x && x.id == postActualId);
        if (!p) {
            feed.innerHTML = `<div style="text-align:center;font-size:11px;padding:20px">El hilo no existe o fue borrado.<br><br><button class="btn-chan" onclick="volverAlFeed()">[← Volver al Índice]</button></div>`;
            return;
        }
        let fecha = p.created_at ? new Date(p.created_at).toLocaleString() : 'Fecha desconocida';
        let sub = p.SubForum || p.subforum || 'general';
        let cs = comentarios ? comentarios.filter(c => c && c.post_ID == p.id) : [];
        let cHtml = cs.map(c => {
            let del = me && me === (c.username || 'Anónimo') ? `<span class="delete-btn" onclick="borrarComentario(${c.id})">[Borrar]</span>` : '';
            return `<div class="comment-card">${obtenerBadgeUser(c.username||'Anónimo')} <span style="color:#666;font-size:10px">${c.created_at?new Date(c.created_at).toLocaleString():''}</span>${del}<div style="margin-top:4px">${formatMessage(c.content)}</div></div>`;
        }).join('');
        let form = currentUserEmail
            ? `<div style="margin-top:12px;background:#eef2f7;padding:10px;border:1px solid #b0c4de"><div style="font-weight:bold;margin-bottom:5px;font-size:11px;color:#004d00">Escribir respuesta:</div><textarea id="comment-input-${p.id}" rows="3" maxlength="500" placeholder="Escribe o pega {Imagen=XD.png}..." style="width:96%;font-family:monospace;font-size:11px;padding:6px"></textarea><div id="selector-respuestas-img" style="margin-top:6px"></div><div style="text-align:right;margin-top:6px"><button class="btn-chan" onclick="enviarComentario(${p.id})">Enviar Respuesta</button></div></div>`
            : `<div style="font-size:11px;color:#666;margin-top:10px;text-align:center">(Inicia sesión para responder)</div>`;
        let delPost = me && me === (p.username || 'Anónimo') ? `<span class="delete-btn" onclick="borrarPost(${p.id})">[Borrar Tema]</span>` : '';

        feed.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;background:#d8e6d8;padding:6px 10px;margin-bottom:10px;border:1px solid #b0c9b0"><a onclick="volverAlFeed()" style="cursor:pointer;color:#004d00;font-weight:bold;font-size:11px">← Volver al tablón (sr/${sub})</a>${renderizarContadorVisitas(p.views||0)}</div><div class="post-card" id="post-${p.id}" style="border:2px solid #2b5c2b"><div class="post-header" style="font-weight:bold">${obtenerBadgeUser(p.username||'Anónimo')} <span style="color:#004400">sr/${sub}</span> <span>${fecha}</span><span style="float:right">No. ${p.id}</span></div><div class="message" style="margin-top:8px">${formatMessage(p.content)}</div><div style="margin-top:10px;border-top:1px dashed #ccc;padding-top:6px;display:flex;gap:10px;align-items:center">${likeBtn(p.id)} (${p.likes||0}) <span class="reply-btn" style="color:#006600" onclick="copiarLinkPost(${p.id})">[Compartir Link]</span>${delPost}</div></div><div style="margin:15px 0 8px;font-size:12px;font-weight:bold;color:#004d00;border-bottom:2px solid #2b5c2b;padding-bottom:3px">💬 Comentarios (${cs.length})</div><div class="comments-section" style="margin-left:0">${cHtml || `<div style="font-size:11px;color:#666;padding:10px;text-align:center">Sin comentarios todavía.</div>`}</div>${form}`;
        pintSelResp(p.id);
        return;
    }

    let q = $('search-input') && $('search-input').value ? $('search-input').value.toLowerCase().trim() : '';
    let list = posts.filter(p => {
        if (!p) return false;
        let sub = p.SubForum || p.subforum || 'general';
        let okSub = currentSubratitaFiltro === 'todos' || sub === currentSubratitaFiltro;
        let okQ = !q || (p.username||'').toLowerCase().includes(q) || (p.content||'').toLowerCase().includes(q) || sub.toLowerCase().includes(q);
        return okSub && okQ;
    });

    if (!list.length) {
        feed.innerHTML = `<div style="text-align:center;font-size:11px;padding:20px">No se encontraron publicaciones en este SubForum.</div>`;
        return;
    }

    feed.innerHTML = list.map(p => {
        let sub = p.SubForum || p.subforum || 'general';
        let nCom = comentarios ? comentarios.filter(c => c && c.post_ID == p.id).length : 0;
        return `<div class="post-card" id="post-${p.id}"><div class="post-header">${obtenerBadgeUser(p.username||'Anónimo')} <span style="color:#004400;font-weight:bold;cursor:pointer" onclick="filtrarPorSubratita('${sub}')">sr/${sub}</span> <span>${p.created_at?new Date(p.created_at).toLocaleString():'Fecha desconocida'}</span><span style="float:right">No. ${p.id}</span></div><div class="message">${formatMessage(p.content)}</div><div style="font-size:11px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;border-top:1px dashed #ddd;padding-top:6px"><div style="display:flex;gap:10px;align-items:center"><span class="reply-btn" onclick="abrirTema(${p.id})" style="font-weight:bold;color:#0033aa">[Ver Comentarios (${nCom})]</span>${likeBtn(p.id)} (${p.likes||0}) <span class="reply-btn" style="color:#006600" onclick="copiarLinkPost(${p.id})">[Compartir]</span></div><div style="font-size:10px;color:#555">👁️ ${p.views||0} visitas</div></div></div>`;
    }).join('');
}

function toggleMenuTresPuntitos(e) {
    if (e) e.stopPropagation();
    let m = $('dropdown-menu-puntitos');
    if (m) m.style.display = m.style.display === 'block' ? 'none' : 'block';
}

document.addEventListener('click', e => {
    let m = $('dropdown-menu-puntitos'), btn = e.target.closest('button[onclick*="toggleMenuTresPuntitos"]');
    if (m && !m.contains(e.target) && !btn) m.style.display = 'none';
});

function cambiarTema(t) {
    document.body.className = `theme-${t}`;
    localStorage.setItem('ninosrata_theme', t);
    if ($('dropdown-menu-puntitos')) $('dropdown-menu-puntitos').style.display = 'none';
}

addEventListener('DOMContentLoaded', () => {
    document.body.className = `theme-${localStorage.getItem('ninosrata_theme') || 'original'}`;
});
