const express = require('express');
const app = express();

const jobs = new Map();

app.use('/api', (req, res, next) => {
    if (req.method === 'POST' && req.path.match(/^\/g[1-7]/)) {
        const jobId = "job123";
        jobs.set(jobId, { done: false, result: null, error: null });

        const originalJson = res.json.bind(res);
        let hasError = false;

        res.status = function(code) {
            if (code >= 400) hasError = true;
            this.statusCode = code;
            return this;
        };

        const noop = function() { return this; };
        res.setHeader = noop;
        res.set = noop;
        res.header = noop;

        res.json = function(data) {
            const job = jobs.get(jobId);
            if (job) {
                if (hasError || data.error) {
                    job.error = data.error || "Unknown error";
                } else {
                    job.result = data;
                }
                job.done = true;
            }
            return this;
        };

        originalJson({ jobId });
        
        process.nextTick(() => {
            try { next(); } catch(e) {}
        });
        return;
    }
    next();
});

app.post('/api/g1/test', async (req, res) => {
    // simulate long work
    setTimeout(() => {
        res.json({ previews: [1,2,3] });
        console.log("Job state after handler:", jobs.get("job123"));
    }, 100);
});

const request = require('http').request;
app.listen(3000, () => {
    const req = request('http://localhost:3000/api/g1/test', { method: 'POST' }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            console.log("Client received:", data);
            setTimeout(() => process.exit(0), 200);
        });
    });
    req.end();
});
