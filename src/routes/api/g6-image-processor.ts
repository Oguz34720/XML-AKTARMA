import { Router } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { shopifyGQL } from '../../lib/shopifyClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getProductsQuery = `
query getProducts($cursor: String) {
  products(first: 10, after: $cursor) {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        id
        title
        media(first: 10) {
          edges {
            node {
              ... on MediaImage {
                id
                image {
                  url
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

const stagedUploadsCreateMutation = `
mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets {
      url
      resourceUrl
      parameters {
        name
        value
      }
    }
    userErrors {
      field
      message
    }
  }
}
`;

const productCreateMediaMutation = `
mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
  productCreateMedia(media: $media, productId: $productId) {
    media {
      id
    }
    mediaUserErrors {
      field
      message
    }
  }
}
`;

const productDeleteMediaMutation = `
mutation productDeleteMedia($mediaIds: [ID!]!, $productId: ID!) {
  productDeleteMedia(mediaIds: $mediaIds, productId: $productId) {
    deletedMediaIds
    mediaUserErrors {
      field
      message
    }
  }
}
`;

async function uploadToStagedUrl(url: string, parameters: any[], filePath: string) {
    const form = new FormData();
    parameters.forEach(param => {
        form.append(param.name, param.value);
    });
    form.append('file', fs.createReadStream(filePath));

    await axios.post(url, form, {
        headers: form.getHeaders(),
    });
}

async function processImage(inputPath: string, outputPath: string) {
    const inputBuffer = fs.readFileSync(inputPath);
    const inputBlob = new Blob([inputBuffer], { type: 'image/jpeg' });
    const blob = await removeBackground(inputBlob);
    const noBgBuffer = Buffer.from(await blob.arrayBuffer());

    const resizedProduct = await sharp(noBgBuffer)
        .resize(1350, 1350, {
            fit: 'inside',
            withoutEnlargement: false
        })
        .normalise()
        .sharpen()
        .toBuffer();

    const meta = await sharp(resizedProduct).metadata();
    const left = Math.round((1500 - (meta.width || 0)) / 2);
    const top = Math.round((1500 - (meta.height || 0)) / 2);

    await sharp({
        create: {
            width: 1500,
            height: 1500,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
    })
    .composite([{ input: resizedProduct, left, top }])
    .webp({ quality: 100, lossless: true })
    .toFile(outputPath);
}

interface JobState {
    jobId: string;
    total: number;
    current: number;
    success: number;
    errorCount: number;
    logs: { id: number; text: string; type: 'success' | 'error' | 'info' }[];
    done: boolean;
}

const jobs = new Map<string, JobState>();

router.post('/start', async (req, res) => {
    const session = res.locals.shopify.session;
    const limitCount = req.query.limit ? parseInt(req.query.limit as string) : Infinity;
    
    // @ts-ignore
    const jobId = Date.now().toString() + Math.random().toString(36).substring(7);
    const jobState: JobState = {
        jobId,
        total: limitCount !== Infinity ? limitCount : 0,
        current: 0,
        success: 0,
        errorCount: 0,
        logs: [],
        done: false
    };
    jobs.set(jobId, jobState);

    // Run async
    (async () => {
        const addLog = (text: string, type: 'success' | 'error' | 'info') => {
            jobState.logs.push({ id: Date.now() + Math.random(), text, type });
        };
        
        try {
            let processedProducts = 0;
            let hasNextPage = true;
            let cursor: string | null = null;
            
            addLog(`Started processing ${jobState.total === 0 ? 'all' : jobState.total} products.`, 'info');

            const tmpDir = path.join(__dirname, '..', '..', '..', 'tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

            while (hasNextPage && processedProducts < limitCount) {
                const result = await shopifyGQL(session, getProductsQuery, { cursor });
                const productsData = result?.products;
                if (!productsData) break;

                const edges = productsData.edges;
                hasNextPage = productsData.pageInfo.hasNextPage;
                cursor = productsData.pageInfo.endCursor;

                for (const edge of edges) {
                    if (processedProducts >= limitCount) break;
                    processedProducts++;
                    
                    const product = edge.node;
                    const medias = product.media.edges;

                    if (medias.length === 0) {
                        addLog(`Skipping ${product.title} (No media)`, 'info');
                        continue;
                    }

                    for (let m = 0; m < medias.length; m++) {
                        const mediaNode = medias[m].node;
                        if (!mediaNode.image || !mediaNode.image.url) continue;

                        const originalUrl = mediaNode.image.url;
                        const mediaId = mediaNode.id;
                        
                        const originalPath = path.join(tmpDir, `orig_${Date.now()}.jpg`);
                        const processedPath = path.join(tmpDir, `proc_${Date.now()}.webp`);

                        try {
                            const dlRes = await axios.get(originalUrl, { responseType: 'arraybuffer' });
                            fs.writeFileSync(originalPath, dlRes.data);

                            await processImage(originalPath, processedPath);

                            const fileSize = fs.statSync(processedPath).size.toString();
                            
                            const stagedRes = await shopifyGQL(session, stagedUploadsCreateMutation, {
                                input: [{
                                    filename: "ai_processed_image.webp",
                                    resource: "IMAGE",
                                    httpMethod: "POST",
                                    fileSize: fileSize,
                                    mimeType: "image/webp"
                                }]
                            });

                            if (stagedRes.stagedUploadsCreate.userErrors.length > 0) {
                                throw new Error("Staged Upload Error: " + JSON.stringify(stagedRes.stagedUploadsCreate.userErrors));
                            }

                            const target = stagedRes.stagedUploadsCreate.stagedTargets[0];
                            await uploadToStagedUrl(target.url, target.parameters, processedPath);

                            const createMediaRes = await shopifyGQL(session, productCreateMediaMutation, {
                                productId: product.id,
                                media: [{
                                    originalSource: target.resourceUrl,
                                    mediaContentType: "IMAGE"
                                }]
                            });

                            if (createMediaRes.productCreateMedia.mediaUserErrors.length > 0) {
                                throw new Error("Create Media Error: " + JSON.stringify(createMediaRes.productCreateMedia.mediaUserErrors));
                            }

                            await shopifyGQL(session, productDeleteMediaMutation, {
                                productId: product.id,
                                mediaIds: [mediaId]
                            });

                            jobState.success++;
                            jobState.current = processedProducts;
                            addLog(`[${processedProducts}/${jobState.total}] ✅ ${product.title}`, 'success');

                        } catch (err: any) {
                            jobState.errorCount++;
                            jobState.current = processedProducts;
                            addLog(`[${processedProducts}/${jobState.total}] ❌ ${product.title} - ${err.message}`, 'error');
                        } finally {
                            if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
                            if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
                        }
                    }
                }
            }
            addLog(`Completed! ${jobState.success} successful, ${jobState.errorCount} failed.`, 'info');
        } catch (error: any) {
            jobState.logs.push({ id: Date.now(), text: `Critical error: ${error.message}`, type: 'error' });
        } finally {
            jobState.done = true;
        }
    })();

    res.json({ jobId });
});

router.get('/status/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) {
        return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
});

export default router;
