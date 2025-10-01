/*
 * Dieses Skript lädt dynamisch alle HTML‑Dateien aus dem Verzeichnis
 * `posts` und fügt deren Inhalte in den Container mit der ID
 * `posts-container` ein.  Es verwendet die GitHub API, um die
 * Dateilisten eines Repositorys abzurufen.  Damit der Code auch
 * funktioniert, wenn die Seite via GitHub Pages bereitgestellt wird,
 * versucht das Skript, den Benutzer- und Repository-Namen aus der
 * aktuellen URL abzuleiten.
 */

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('posts-container');
    if (!container) return;

    // Ermittelt den Besitzer (Benutzername) anhand des Hostnamens (z.B. "username.github.io").
    const hostnameParts = window.location.hostname.split('.');
    let owner = hostnameParts[0];

    // Bei lokalen Tests (z.B. localhost) einen Platzhalter verwenden.
    if (window.location.hostname === 'localhost' || owner === 'localhost') {
        owner = 'owner';
    }

    // Ermittelt den Repository-Namen aus dem ersten Teil des Pfads.
    // Auf GitHub Pages lautet die URL: https://username.github.io/reponame/
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    // Wenn kein spezifischer Pfad vorhanden ist, wird der Benutzername als Repository angenommen (User/Org Pages).
    let repo = pathParts.length > 0 ? pathParts[0] : owner;

    // Funktion zum Laden der Posts von der GitHub API.
    function loadPostsFromGitHub() {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/posts`;
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Konnte die Dateiliste nicht abrufen.');
                }
                return response.json();
            })
            .then(files => {
                // Sortiert die Dateien nach Name, damit Posts in natürlicher Reihenfolge erscheinen.
                files.filter(f => f.name.endsWith('.html')).sort((a, b) => a.name.localeCompare(b.name)).forEach(file => {
                    fetch(file.download_url)
                        .then(res => res.text())
                        .then(html => {
                            const div = document.createElement('div');
                            div.innerHTML = html;
                            container.appendChild(div);
                        })
                        .catch(err => {
                            console.error('Fehler beim Laden der Datei ' + file.name, err);
                        });
                });
            })
            .catch(err => {
                console.error('Fehler beim Abrufen der Posts:', err);
                container.innerHTML = '<p style="color:red">Es gab ein Problem beim Laden der Posts. Bitte überprüfen Sie Ihre Netzwerkeinstellungen oder die Repository-Konfiguration.</p>';
            });
    }

    // Beim lokalen Test (z.B. file:// oder localhost) lokal aus dem Verzeichnis laden.
    function loadPostsLocally() {
        fetch('posts/')
            .then(response => response.text())
            .then(text => {
                // Der lokale Server liefert typischerweise eine Verzeichnisliste im HTML-Format aus.
                // Wir extrahieren alle Links, die auf .html enden.
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                const links = Array.from(doc.querySelectorAll('a'));
                const htmlLinks = links.filter(link => link.getAttribute('href') && link.getAttribute('href').endsWith('.html'));
                htmlLinks.sort((a, b) => a.getAttribute('href').localeCompare(b.getAttribute('href')));
                htmlLinks.forEach(link => {
                    const filePath = 'posts/' + link.getAttribute('href');
                    fetch(filePath)
                        .then(res => res.text())
                        .then(html => {
                            const div = document.createElement('div');
                            div.innerHTML = html;
                            container.appendChild(div);
                        });
                });
            })
            .catch(err => {
                console.error('Lokales Laden der Posts fehlgeschlagen:', err);
            });
    }

    // Entscheidung: Wenn wir auf GitHub Pages oder einer anderen Domain sind, verwenden wir die GitHub API.
    // Bei lokalem Test (localhost oder file://) verwenden wir den lokalen Pfad.
    if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
        loadPostsLocally();
    } else {
        loadPostsFromGitHub();
    }
});