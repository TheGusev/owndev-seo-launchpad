/**
 * services/developerPack — orchestrator.
 *
 * Public API:
 *   • buildPack(input, mode, platform?) → PackBundle
 *   • exportPack(pack, mode, platform?) → PackBundle (re-serialize without recomposing)
 */

import type {
  SuperPromptPack,
  ExportMode,
  PlatformTarget,
  PackBundle,
  PackArtifact,
} from './types.js';
import { composePack, type ComposeInput } from './composer.js';
import { assertValidPack, validatePack } from './validator.js';
import { serializeStructured } from './serializers/structured.js';
import { serializeLovable } from './serializers/lovable.js';
import { serializeCursor } from './serializers/cursor.js';
import { serializeV0 } from './serializers/v0.js';
import { serializeClaudeCode } from './serializers/claude_code.js';
import { buildZip } from './zipBuilder.js';

export class DeveloperPackService {
  async buildPack(
    input: ComposeInput,
    mode: ExportMode = 'structured',
    platform?: PlatformTarget,
  ): Promise<PackBundle> {
    const pack = composePack(input);
    pack.export_mode = mode;
    if (platform) pack.platform_target = platform;
    assertValidPack(pack);
    return this.exportPack(pack, mode, platform);
  }

  async exportPack(
    pack: SuperPromptPack,
    mode: ExportMode = 'structured',
    platform?: PlatformTarget,
  ): Promise<PackBundle> {
    let artifacts: PackArtifact[];
    if (mode === 'full') {
      artifacts = [
        {
          filename: 'super_prompt_pack.json',
          content: JSON.stringify(pack, null, 2),
          content_type: 'application/json',
        },
      ];
    } else if (mode === 'platform_specific') {
      artifacts = serializeForPlatform(pack, platform ?? 'lovable');
    } else {
      artifacts = serializeStructured(pack);
    }

    const zipBuffer = mode === 'full' ? undefined : await buildZip(artifacts);
    return { mode, platform, artifacts, zip_buffer: zipBuffer, pack };
  }

  validate(pack: unknown) {
    return validatePack(pack);
  }
}

function serializeForPlatform(pack: SuperPromptPack, platform: PlatformTarget): PackArtifact[] {
  switch (platform) {
    case 'lovable':
      return serializeLovable(pack);
    case 'cursor':
      return serializeCursor(pack);
    case 'v0':
      return serializeV0(pack);
    case 'claude_code':
      return serializeClaudeCode(pack);
    case 'raw':
    default:
      return serializeStructured(pack);
  }
}

export const developerPackService = new DeveloperPackService();
