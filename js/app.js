// PURPOSE: Handle Firebase Authentication errors

function handleError(err, email, password) {
    switch (err.code) {
        case 'auth/email-already-in-use':
        case 'auth/invalid-email':
        case 'auth/user-disabled':
        case 'auth/user-not-found':
            email.setCustomValidity(err.message);
            email.reportValidity();
            break;
        case 'auth/weak-password':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            password.setCustomValidity(err.message);
            password.reportValidity();
            break;
        case 'auth/operation-not-allowed':
        case 'auth/missing-android-pkg-name':
        case 'auth/missing-continue-uri':
        case 'auth/missing-ios-bundle-id':
        case 'auth/invalid-continue-uri':
        case 'auth/unauthorized-continue-uri':
        case 'auth/requires-recent-login':
        case 'auth/too-many-requests':
        default:
            alert(err.message);
            break;
    }
}

// ----------------------------------------------------------------------------

// PURPOSE: Cloud Firestore onSnapshot handler
function handleSnapshot(snap, arr, key = 'id') {
    snap.docChanges().forEach(change => {
        const { doc, type, oldIndex, newIndex } = change;
        const f = { [key]: doc.id, ...doc.data() };

        if (type == 'added') {
            arr.splice(newIndex, 0, f);
        }
        else if (type == 'modified') {
            arr.splice(oldIndex, 1);
            arr.splice(newIndex, 0, f);
        }
        else if (type == 'removed') {
            arr.splice(oldIndex, 1);
        }
    });
}

// ----------------------------------------------------------------------------

// PURPOSE: Load component (enhanced)
function load(comp) {
    return () => fetch(`_${comp}.html`)
        .then(resp => resp.text())
        .then(text => {
            // Obtain <style>, <template> and <script> contents
            const root = document.createElement('body');
            root.innerHTML = text;

            const style = root.querySelector('style');
            const template = root.querySelector('template');
            let script = root.querySelector('script');

            // Style --------------------------------------
            if (style) {
                const css = new CSSStyleSheet();
                css.replaceSync(style.textContent);
                style.textContent = '';
                for (const rule of css.cssRules) {
                    if (rule.selectorText.startsWith(':root')) {
                        rule.selectorText = rule.selectorText.replace(':root', `#${comp}-content`);
                    } 
                    else {
                        rule.selectorText = `#${comp}-content ${rule.selectorText}`;
                    }
                    style.textContent += rule.cssText;
                }
            }

            // Template -----------------------------------
            if (template) {
                template.id = `${comp}-template`;
                template.content.firstElementChild.id = `${comp}-content`;
            }

            // Script -----------------------------------
            if (script) {
                const s = script.textContent.replace('app.component(', `app.component('${comp}',`);
                script = document.createElement('script');
                script.textContent = s;
            }
            else {
                const s = `app.component('${comp}', { });`;
                script = document.createElement('script');
                script.textContent = s;
            }

            // Append contents to main document
            document.body.append(style ?? '', template ?? '', script);

            // Update template id
            if (template) {
                app.component(comp).template = '#' + template.id;
            }

            return app.component(comp);
        });
}

// ----------------------------------------------------------------------------

// PURPOSE: Center-crop image to the width and height specified (upscale)
function crop(f, w, h, to = 'blob', type = 'image/jpeg') {
    return new Promise((resolve, reject) => { 
        const img = document.createElement('img');
        
        img.onload = e => {
            URL.revokeObjectURL(img.src);
            
            // Resize algorithm ---------------------------
            let ratio = w / h;

            let nw = img.naturalWidth;
            let nh = img.naturalHeight;
            let nratio = nw / nh;

            let sx, sy, sw, sh;

            if (ratio >= nratio) {
                // Retain width, calculate height
                sw = nw;
                sh = nw / ratio;
                sx = 0;
                sy = (nh - sh) / 2;
            }
            else {
                // Retain height, calculate width
                sw = nh * ratio;
                sh = nh;
                sx = (nw - sw) / 2;
                sy = 0;
            }
            // --------------------------------------------

            const can = document.createElement('canvas');
            can.width  = w;
            can.height = h;
            can.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

            // Resolve to blob or dataURL
            if (to == 'blob') {
                can.toBlob(blob => resolve(blob), type);
            }
            else if (to == 'dataURL') {
                let dataURL = can.toDataURL(type);
                resolve(dataURL);
            }
            else {
                reject('ERROR: Specify blob or dataURL');
            }
        };

        img.onerror = e => {
            URL.revokeObjectURL(img.src);
            reject('ERROR: File is not an image');
        };

        img.src = URL.createObjectURL(f);
    });
}

// PURPOSE: Best-fit image within the width and height specified (no upscale)
function fit(f, w, h, to = 'blob', type = 'image/jpeg') {
    return new Promise((resolve, reject) => { 
        const img = document.createElement('img');
        
        img.onload = e => {
            URL.revokeObjectURL(img.src);
            
            // Resize algorithm ---------------------------
            let ratio = w / h;

            let nw = img.naturalWidth;
            let nh = img.naturalHeight;
            let nratio = nw / nh;

            if (nw <= w && nh <= h) {
                // Smaller than targetted width and height, do nothing
                w = nw;
                h = nh;
            }
            else {
                if (nratio >= ratio) {
                    // Retain width, calculate height
                    h = w / nratio;
                }
                else {
                    // Retain height, calculate width
                    w = h * nratio;
                }
            }
            // --------------------------------------------

            const can = document.createElement('canvas');
            can.width  = w;
            can.height = h;
            can.getContext('2d').drawImage(img, 0, 0, w, h);

            // Resolve
            if (to == 'blob') {
                can.toBlob(blob => resolve(blob), type);
            }
            else if (to == 'dataURL') {
                let dataURL = can.toDataURL(type);
                resolve(dataURL);
            }
            else {
                reject('ERROR: Specify blob or dataURL');
            }
        };

        img.onerror = e => {
            URL.revokeObjectURL(img.src);
            reject('ERROR: File is not an image');
        };

        img.src = URL.createObjectURL(f);
    });
}