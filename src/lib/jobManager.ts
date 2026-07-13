import { Request, Response } from 'express';

interface Job {
    done: boolean;
    result: any;
    error: any;
}

const jobs = new Map<string, Job>();

export function getJobStatus(jobId: string) {
    return jobs.get(jobId);
}

export function createJob(jobId: string) {
    jobs.set(jobId, { done: false, result: null, error: null });
}

export function updateJob(jobId: string, payload: any, isError: boolean) {
    const job = jobs.get(jobId);
    if (job) {
        if (isError) {
            job.error = payload.error || payload || "Unknown error";
        } else {
            job.result = payload;
        }
        job.done = true;
    }
}

export function withJob(handler: (req: Request, res: Response) => Promise<any>) {
    return (req: Request, res: Response) => {
        const jobId = Date.now().toString() + Math.random().toString(36).substring(7);
        jobs.set(jobId, { done: false, result: null, error: null });

        const fakeRes = {
            locals: res.locals,
            json: (data: any) => {
                const job = jobs.get(jobId);
                if (job) {
                    job.result = data;
                    job.done = true;
                }
                return fakeRes;
            },
            status: (code: number) => fakeRes,
        } as unknown as Response;

        handler(req, fakeRes).catch((err: any) => {
            const job = jobs.get(jobId);
            if (job) {
                job.error = err.message;
                job.done = true;
            }
        });

        res.json({ jobId });
    };
}
