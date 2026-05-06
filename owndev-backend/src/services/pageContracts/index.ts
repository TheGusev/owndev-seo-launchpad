/**
 * services/pageContracts — V3 page contracts API.
 */
export * from './types.js';
export { listV3Contracts, getV3Contract } from './repository.js';
export {
  generatePageContract,
  renderTemplate,
  type BrandRenderContext,
} from './contractGenerator.js';
