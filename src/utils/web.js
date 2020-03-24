export function buildQuery(data) {
    return Object.keys(data)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
        .join('&');
}

export function redirect(path) {
    window.location.replace(path);
}

export function clickLink(path) {
    window.location.href = path;
}

export function newTab(path) {
    let link = document.createElement('a');
    link.href = path;
    link.target = "_blank";
    link.click();
}

export function url(pathname, query) {
    let loc = window.location;
    let webPath;

    if (pathname) {
        if (pathname[0] === "/") {
            webPath = pathname.substr(1);
        } else {
            webPath = pathname;
        } 
    } else {
        webPath = loc.pathname[0] === '/' ? loc.pathname.substr(1) : loc.pathname;
    }

    return loc.protocol + "//" + loc.host + "/" + webPath + (query ? ('?' + buildQuery(query)) : loc.search);
}