/**
 * services/developerPack — zip builder.
 *
 * Wraps PackArtifact[] into a single ZIP buffer using JSZip.
 */

import JSZip from 'jszip';
import type { PackArtifact } from './types.js';

export async function buildZip(artifacts: PackArtifact[]): Promise<Buffer> {
  const zip = new JSZip();
  for (const a of artifacts) {
    const data = typeof a.content === 'string' ? a.content : a.content;
    zip.file(a.filename, data);
  }
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
