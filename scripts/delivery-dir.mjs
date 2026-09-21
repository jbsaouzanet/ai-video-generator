// Default delivery folder for finished renders: ~/Koofr/RocketAIM. Override with DELIVERY_DIR=<path>, disable with DELIVERY_DIR=none.
import os from 'node:os';

export const DEFAULT_DELIVERY = os.homedir().split(String.fromCharCode(92)).join('/') + '/Koofr/RocketAIM';
