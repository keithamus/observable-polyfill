import { apply, isSupported } from './observable.js';
if (!isSupported()) apply();
