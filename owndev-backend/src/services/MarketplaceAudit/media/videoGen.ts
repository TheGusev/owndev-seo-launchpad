import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import { logger } from '../../../utils/logger.js';

export interface VideoGenInput {
  auditId: string;
  imageUrls: string[];
  captions: string[];
}

export interface VideoGenResult {
  url: string | null;
  filePath: string | null;
}

const PUBLIC_DIR =
  process.env.MARKETPLACE_VIDEO_DIR || '/var/www/owndev.ru/public/marketplace-videos';
const PUBLIC_URL_BASE =
  process.env.MARKETPLACE_VIDEO_URL_BASE || 'https://owndev.ru/marketplace-videos';

async function runCmd(cmd: string, args: string[], timeoutMs: number): Promise<{ ok: boolean; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); }, timeoutMs);
    child.stderr.on('data', (b) => { stderr += b.toString(); if (stderr.length > 8000) stderr = stderr.slice(-8000); });
    child.on('close', (code) => { clearTimeout(timer); resolve({ ok: code === 0, stderr }); });
    child.on('error', (e) => { clearTimeout(timer); resolve({ ok: false, stderr: stderr + '\n' + e.message }); });
  });
}

async function ensureFfmpeg(): Promise<boolean> {
  const r = await runCmd('ffmpeg', ['-version'], 5000);
  return r.ok;
}

async function downloadImage(url: string, dst: string): Promise<boolean> {
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!resp.ok) return false;
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 1024) return false;
    await fs.writeFile(dst, buf);
    return true;
  } catch (e) {
    logger.warn('MA_VID', `download failed ${url}: ${(e as Error).message}`);
    return false;
  }
}

function escapeDrawText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,')
    .slice(0, 90);
}

export async function generateSlideshowVideo(input: VideoGenInput): Promise<VideoGenResult> {
  if (!input.imageUrls.length) return { url: null, filePath: null };

  const ok = await ensureFfmpeg();
  if (!ok) {
    logger.warn('MA_VID', 'ffmpeg unavailable on host — skipping video generation');
    return { url: null, filePath: null };
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `ma-vid-${input.auditId}-`));
  try {
    // Download images
    const localImgs: string[] = [];
    for (let i = 0; i < input.imageUrls.length; i++) {
      const dst = path.join(tmpDir, `img${i}.png`);
      if (await downloadImage(input.imageUrls[i], dst)) localImgs.push(dst);
    }
    if (localImgs.length === 0) {
      logger.warn('MA_VID', 'no images downloaded — abort');
      return { url: null, filePath: null };
    }

    // Build ffmpeg input list (concat demuxer with explicit per-image duration)
    // Each image shown for 4s, fade transitions implicit via simple concat (avoid xfade complexity).
    const listPath = path.join(tmpDir, 'list.txt');
    const PER_IMG_SEC = 4;
    let listContent = '';
    for (const p of localImgs) {
      listContent += `file '${p}'\nduration ${PER_IMG_SEC}\n`;
    }
    // last image must be repeated without duration (ffmpeg concat demuxer quirk)
    listContent += `file '${localImgs[localImgs.length - 1]}'\n`;
    await fs.writeFile(listPath, listContent);

    // Captions overlay: take up to N captions, one per image
    const captions = input.captions
      .map((c) => (c ?? '').toString().trim())
      .filter(Boolean)
      .slice(0, localImgs.length);

    // Build vf chain: scale to 1080x1080, then drawtext per segment by enable= timeline
    const vfParts: string[] = ['scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:white,format=yuv420p'];
    captions.forEach((cap, idx) => {
      const start = idx * PER_IMG_SEC;
      const end = start + PER_IMG_SEC;
      const txt = escapeDrawText(cap);
      vfParts.push(
        `drawtext=text='${txt}':fontcolor=white:fontsize=46:` +
        `box=1:boxcolor=0x000000AA:boxborderw=18:` +
        `x=(w-text_w)/2:y=h-160:enable='between(t,${start},${end})'`,
      );
    });

    await fs.mkdir(PUBLIC_DIR, { recursive: true });
    const outPath = path.join(PUBLIC_DIR, `${input.auditId}.mp4`);

    const args = [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', listPath,
      '-vf', vfParts.join(','),
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-movflags', '+faststart',
      outPath,
    ];
    const ff = await runCmd('ffmpeg', args, 180_000);
    if (!ff.ok) {
      logger.warn('MA_VID', `ffmpeg failed: ${ff.stderr.slice(-400)}`);
      return { url: null, filePath: null };
    }
    const stat = await fs.stat(outPath).catch(() => null);
    if (!stat || stat.size < 5000) {
      logger.warn('MA_VID', 'ffmpeg produced empty/small file');
      return { url: null, filePath: null };
    }
    return {
      url: `${PUBLIC_URL_BASE.replace(/\/$/, '')}/${input.auditId}.mp4`,
      filePath: outPath,
    };
  } catch (e) {
    logger.warn('MA_VID', `video gen failed: ${(e as Error).message}`);
    return { url: null, filePath: null };
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
