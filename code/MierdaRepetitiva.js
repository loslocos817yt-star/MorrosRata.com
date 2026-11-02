const SUPABASE_URL = 'https://rioyrsemrzcznwhjwanj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpb3lyc2Vtcnpjem53aGp3YW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNjUwNDAsImV4cCI6MjEwNzg0MTA0MH0.lkjOmIPdqWCWm6h42RkJNjnjFciFQxATcsTx8knPUeg';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUserEmail = '';
let allPostsData = [];
let allCommentsData = [];
let currentSubratitaFiltro = 'todos';
let knownCommentsCount = 0;
const ADMIN_USERS = ['doryansanchez72'];

async function handleSignUp() {
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    const msg = document.getElementById('status-msg');
    if (!emailField || !passwordField || !msg) return;
    const email = emailField.value.trim();
    const password = passwordField.value;
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
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    const msg = document.getElementById('status-msg');
    if (!emailField || !passwordField || !msg) return;
    const email = emailField.value.trim();
    const password = passwordField.value;
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

async function enviarPost() {
    let subForumSelect = document.getElementById('p-subratita').value;
    let content = document.getElementById('p-content').value.trim();
    let status = document.getElementById('post-status');

    if (!subForumSelect) {
        status.style.color = 'red';
        status.innerText = "Selecciona una SubRatita.";
        document.getElementById('p-subratita').focus();
        return;
    }

    if (!content) {
        status.style.color = 'red';
        status.innerText = "Escribe un mensaje.";
        document.getElementById('p-content').focus();
        return;
    }

    let recaptchaResponse = "";
    try { recaptchaResponse = grecaptcha.getResponse(); } catch (e) {}

    if (!recaptchaResponse) {
        status.style.color = 'red';
        status.innerText = "Completa el reCAPTCHA.";
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
        try { grecaptcha.reset(); } catch(e) {}
        localStorage.removeItem('norros_draft');
        actualizarContador();
        cerrarCajaPost();
        cargarPosts();
    }
}

async function borrarPost(postId) {
    if (!confirm("¿Borrar publicación?")) return;
    let { error } = await supabaseClient.from('jodidosPOST').delete().eq('id', postId);
    if (!error) cargarPosts();
    else alert("Error: " + error.message);
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
        alert("Error: " + error.message);
    }
}

async function borrarComentario(commentId) {
    if (!confirm("¿Borrar comentario?")) return;
    let { error } = await supabaseClient.from('JodeteComentarios').delete().eq('id', commentId);
    if (!error) cargarPosts();
    else alert("Error: " + error.message);
}

async function darLike(postId) {
    let votados = JSON.parse(localStorage.getItem('voted_posts') || '[]');
    if (votados.includes(postId)) {
        alert("Ya le diste Basado a este post, no seas ansioso.");
        return;
    }

    let { data, error: fetchError } = await supabaseClient.from('jodidosPOST').select('likes').eq('id', postId).single();
    if (fetchError) {
        alert("Error al dar like.");
        return;
    }

    let nuevoContador = (data.likes || 0) + 1;

    let { error } = await supabaseClient.from('jodidosPOST').update({ likes: nuevoContador }).eq('id', postId);
    
    if (!error) {
        votados.push(postId);
        localStorage.setItem('voted_posts', JSON.stringify(votados));
        
        // Actualizar el valor al instante en la memoria local para repintar sin recargar
        let postLocal = allPostsData.find(p => p.id === postId);
        if (postLocal) {
            postLocal.likes = nuevoContador;
        }
        renderFeed(allPostsData, allCommentsData);
    } else {
        alert("Error al actualizar like: " + error.message);
    }
}

async function cargarPosts() {
    let feed = document.getElementById('feed');
    if (!feed) return;
    let { data: posts, error } = await supabaseClient.from('jodidosPOST').select('*');
    if (error) {
        feed.innerHTML = `<div style="color:red; text-align:center;">Error: ${error.message}</div>`;
        return;
    }
    if (!posts || posts.length === 0) {
        feed.innerHTML = `<div style="text-align:center; font-size:11px;">No hay publicaciones todavía.</div>`;
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
        nuevosComentarios.slice(knownCommentsCount).forEach(c => {
            if (c && misPostIds.includes(c.post_ID) && c.username !== currentUsername) {
                enviarNotificacionCelular(`¡Nueva respuesta!`, `ur/${c.username} te respondió.`);
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

window.addEventListener('hashchange', () => {
    leerSubratitaDesdeURL();
    renderFeed(allPostsData, allCommentsData);
    actualizarNavSubratitas();
    resaltarPostCompartido();
});

checkSession();
cargarBorrador();
cargarPosts();
setInterval(() => { cargarPosts(); }, 15000);
