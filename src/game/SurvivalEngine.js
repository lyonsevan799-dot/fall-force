import { EndlessEngine } from '@/game/endlessEngine';

export default class SurvivalEngine extends EndlessEngine {
  constructor(options) { super({ ...options, mode: 'survival' }); }
}