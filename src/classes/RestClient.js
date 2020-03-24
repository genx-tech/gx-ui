import request from 'superagent';

const AllowedMethods = {
    'get': 'get',
    'post': 'post',
    'put': 'put',
    'del': 'del',
    'download': 'get',
    'upload': 'post'
};

function resToPath(parts) {
    return '/' + Array.isArray(parts) ? parts.map(res => encodeURIComponent(res)).join('/') : encodeURIComponent(parts);
}

class RestClient {
    constructor(clientId, endpoint, localAuthKey, afterLogin) {
        this.clientId = clientId;
        this.endpoint = endpoint;
        this.localAuthKey = localAuthKey;
        this.afterLogin = afterLogin;

        try {
            this.authToken = JSON.parse(window.localStorage.getItem(this.localAuthKey));
            this.afterLogin(this.authToken.user);
        } catch (err) {
            delete this.authToken;
        }
    }

    async login(username, password) {
        this.logout();  

        try {
            let res = await request.post(this.endpoint + '/' + 'login').send({ username, password });

            let ret = res.body;

            if (ret.token) {
                this.authToken = ret;
                window.localStorage.setItem(this.localAuthKey, JSON.stringify(this.authToken));
                this.afterLogin(this.authToken.user);
            }

            return ret;
        } finally {            
        }
    }

    logout() {
        delete this.authToken;
        window.localStorage.removeItem(this.localAuthKey);
    }

    async do(method, path, query, body, onProgress) {
        method = method.toLowerCase();
        let httpMethod = AllowedMethods[method];
        if (!httpMethod) {
            throw new Error('Invalid method: ' + method);
        }

        let req = request[httpMethod](this.endpoint + path)
            .set('X-GX-APP-ID', this.clientId);

        if (this.authToken) {
            req = req.set('Authorization', `Bearer ${this.authToken.token}`);
        }             

        if (query) {
            req.query(query);
        }

        if (method === 'download') {
            req.send(body);
        } else if (method === 'upload') {
            req.attach("file", body);
            req.set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
        } else {
            req.send(body);
        }

        if (onProgress) {
            req.on('progress', onProgress);
        }

        try {
            let res = await req;

            if ((!res.body || res.body === '') && res.text !== '') {
                return res.text;
            }

            return res.body;
        } catch (error) {
            if (error.response && error.response.body) {
                if (error.response.body.error === "token expired" && this.onTokenExpired) {
                    this.onTokenExpired();
                    throw error;
                } else {
                    throw error.response.body.error;
                }
            } else {
                throw error;
            }
        }
    }

    async get(resource, query) {
        return this.do('get',
            resToPath(resource),
            query);
    }

    async post(resource, data, query) {
        return this.do('post',
            resToPath(resource),
            query, data);
    }

    async put(resource, data, query) {
        return this.do('put',
            resToPath(resource),
            query, data);
    }

    async del(resource, query) {
        return this.do('del',
            resToPath(resource),
            query);
    }

    async upload(resource, file, query, onProgress) {
        return this.do('upload',
            resToPath(resource),
            query, file, onProgress);
    }
}

export default RestClient;