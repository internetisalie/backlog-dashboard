import { describe, it, expect, beforeEach, vi } from 'vitest';
import { refreshIndex, getIndex, loadConfig, indexBacklog } from './backlog-watcher';

describe('backlog-watcher', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('loadConfig', () => {
    it('should load backlog configs from backlogs.yaml', () => {
      const configs = loadConfig();
      expect(configs.length).toBeGreaterThanOrEqual(1);
      const glimmer = configs.find((c) => c.name === 'Glimmer');
      expect(glimmer).toMatchObject({
        name: 'Glimmer',
        path: '/home/mini/Documents/src/glimmer-project',
      });
    });
  });

  describe('indexBacklog', () => {
    it('should find backlog items in the glimmer-project', () => {
      const items = indexBacklog('/home/mini/Documents/src/glimmer-project', 'Glimmer');
      expect(items.length).toBeGreaterThan(0);
      expect(items[0]).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        status: expect.any(String),
        priority: expect.any(String),
      });
    });

    it('should skip README.md and format.md files', () => {
      const items = indexBacklog('/home/mini/Documents/src/glimmer-project', 'Glimmer');
      const filenames = items.map((i) => i.path);
      expect(filenames).not.toContain('README.md');
      expect(filenames).not.toContain('format.md');
    });

    it('should skip artifact directories (e.g., GDT-001/)', () => {
      const items = indexBacklog('/home/mini/Documents/src/glimmer-project', 'Glimmer');
      const filenames = items.map((i) => i.path);
      filenames.forEach((path) => {
        expect(path).not.toMatch(/^[A-Z]+-\d+\/[^/]+\.md$/);
      });
    });
  });

  describe('getIndex', () => {
    it('should return cached items after refreshIndex', () => {
      refreshIndex();
      const items = getIndex();
      expect(Array.isArray(items)).toBe(true);
    });
  });
});
