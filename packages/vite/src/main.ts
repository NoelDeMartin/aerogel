import Vue from '@vitejs/plugin-vue';
import type { Plugin } from 'vite';

export default function Aerogel(): Plugin[] {
  return [Vue()];
}
