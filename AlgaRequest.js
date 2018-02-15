/**
 * Created by www.Alga.me on 13/2/18.
 */

import http from 'http'
import https from 'https'
import querystring from 'querystring'

export default class AlgaRequest {
    constructor(props = {}) {
        this.props = props;
        this.setOptions();
    }

    setOptions(options){
        const opt = Object.assign({}, this.props, options);

        // TODO: Improve this solution
        opt.protocol = 'http:';
        this._theRequest = http.request;

        if(opt.url.indexOf('https') > -1){
            this._theRequest = https.request;
        }

        opt.hostname = this._gethostname(opt.url);
        if(!opt.hostname) {
            throw new Error('Invalid URL');
        }

        // TODO: Improve this solution
        if(!opt.path){
            opt.path = opt.url.replace(/^.*\/\/[^\/]+:?[0-9]?/i, '');
            if(!opt.path) {
                opt.path = '/'
            }
        }

        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        if(opt.json) {
            headers = {
                'Content-Type': 'application/json'
            };
        }

        this.options = {
            hostname: opt.hostname,
            path: opt.path,
            method: opt.method,
            auth: opt.auth,
            body: this._encodeBody(opt.body),
            headers
        };

        if(opt.headers) {
            Object.assign(this.options.headers, opt.headers);
        }

        return this.options;
    }

    post(data) {
        const {body} = data;
        if(!body) {
            throw new Error('Body is required');
        }
        data.body = this._encodeBody(data.body);
        Object.assign(this.options, { method: 'POST' }, data);
        return this._request();
    }

    // private methods
    _encodeBody(body){
        if(this.props.json){
            try {
                return JSON.stringify(body);
            } catch (e) {
                return '';
            }
        }

        return querystring.stringify(body);
    }

    _gethostname(url){
        try{
            return url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i)[2];
        } catch (e) {
            return false;
        }
    }


    _request(){
        // add the post length to the request
        Object.assign(this.options.headers, {'Content-Length': Buffer.byteLength(this.options.body)});

        return new Promise((resolve,reject)=>{
            const req = this._theRequest(this.options, (res) => {
                res.setEncoding('utf8');

                res.on('data', (chunk) => true);

                res.on('end', () => {
                    if(res.statusCode && !res.statusCode.toString().match(/^20/)) {
                        console.error(`problem with request: ${res.statusCode}`);
                        return reject(res.statusCode);
                    }

                    return resolve(true);
                });
            });

            req.on('error', (e) => {
                console.error(`problem with request: ${e}`);
                reject(e.message);
            });

            // write data to request body
            req.write(this.options.body);
            req.end();
        });
    }
}
