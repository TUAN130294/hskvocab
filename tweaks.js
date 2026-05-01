/* Theme switcher — vanilla JS, no React dependency */
(function() {
    const THEMES = {
        clean: { label: 'Clean', subtitle: 'Editorial · warm white', swatch: ['#f7f4ee', '#1a1916', '#c0392b'] },
        ink:   { label: 'Ink',   subtitle: 'Dark CJK · gold accent',  swatch: ['#0e1411', '#e8b339', '#f0e8d4'] },
        soft:  { label: 'Soft',  subtitle: 'Modern · indigo accent',   swatch: ['#f4f4f6', '#6366f1', '#18181b'] }
    };

    const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
        "theme": "ink"
    }/*EDITMODE-END*/;

    let panel = null;
    let active = false;
    let currentTheme = TWEAK_DEFAULTS.theme;

    // Apply on init
    applyTheme(currentTheme);

    function applyTheme(theme) {
        currentTheme = theme;
        if (theme === 'clean') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    function setTheme(theme) {
        applyTheme(theme);
        // persist
        try {
            window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { theme } }, '*');
        } catch(e) {}
        renderPanel();
    }

    function buildPanel() {
        const wrap = document.createElement('div');
        wrap.className = 'tweaks-panel-wrap';
        wrap.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 200;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: none;
        `;
        wrap.innerHTML = `
            <div style="
                background: rgba(255,255,255,.96);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(0,0,0,.08);
                border-radius: 16px;
                box-shadow: 0 24px 48px -12px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.04);
                padding: 18px 18px 16px;
                width: 280px;
                color: #18181b;
            ">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
                    <div style="font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#52525b">Tweaks</div>
                    <button id="tw-close" aria-label="Close" style="
                        background:none;border:none;cursor:pointer;color:#a1a1aa;
                        font-size:18px;line-height:1;padding:4px 6px;border-radius:6px;
                    ">×</button>
                </div>
                <div style="font-size:11px;font-weight:600;color:#71717a;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:10px">Theme</div>
                <div id="tw-themes" style="display:flex;flex-direction:column;gap:6px"></div>
            </div>
        `;
        document.body.appendChild(wrap);

        wrap.querySelector('#tw-close').addEventListener('click', () => {
            hide();
            try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch(e) {}
        });

        return wrap;
    }

    function renderPanel() {
        if (!panel) return;
        const list = panel.querySelector('#tw-themes');
        list.innerHTML = '';
        Object.entries(THEMES).forEach(([key, t]) => {
            const btn = document.createElement('button');
            const isActive = key === currentTheme;
            btn.style.cssText = `
                display:flex;align-items:center;gap:12px;
                padding:10px 12px;
                background:${isActive ? '#f4f4f6' : 'transparent'};
                border:1px solid ${isActive ? '#d1d1d8' : 'transparent'};
                border-radius:10px;cursor:pointer;
                text-align:left;width:100%;
                transition:background .12s ease, border-color .12s ease;
                font-family:inherit;
            `;
            btn.innerHTML = `
                <div style="display:flex;gap:3px;flex-shrink:0">
                    ${t.swatch.map(c => `<div style="width:14px;height:24px;border-radius:3px;background:${c};border:1px solid rgba(0,0,0,.06)"></div>`).join('')}
                </div>
                <div style="flex:1;min-width:0">
                    <div style="font-size:13px;font-weight:600;color:#18181b;line-height:1.2">${t.label}</div>
                    <div style="font-size:11px;color:#71717a;margin-top:2px">${t.subtitle}</div>
                </div>
                <div style="
                    width:16px;height:16px;border-radius:50%;
                    border:1.5px solid ${isActive ? '#18181b' : '#d4d4d8'};
                    flex-shrink:0;display:grid;place-items:center;
                ">${isActive ? '<div style="width:8px;height:8px;border-radius:50%;background:#18181b"></div>' : ''}</div>
            `;
            btn.addEventListener('mouseenter', () => { if (!isActive) btn.style.background = '#fafafa'; });
            btn.addEventListener('mouseleave', () => { if (!isActive) btn.style.background = 'transparent'; });
            btn.addEventListener('click', () => setTheme(key));
            list.appendChild(btn);
        });
    }

    function show() {
        if (!panel) {
            panel = buildPanel();
            renderPanel();
        }
        panel.style.display = 'block';
        active = true;
    }

    function hide() {
        if (panel) panel.style.display = 'none';
        active = false;
    }

    // Host protocol — listener FIRST, then announce
    window.addEventListener('message', (e) => {
        const d = e.data;
        if (!d || typeof d !== 'object') return;
        if (d.type === '__activate_edit_mode') show();
        else if (d.type === '__deactivate_edit_mode') hide();
    });

    // Announce
    try {
        window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    } catch(e) {}
})();
