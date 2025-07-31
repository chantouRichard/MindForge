// stores/repository.js
import { defineStore } from 'pinia';

export const useRepositoryStore = defineStore('repository', {
  state: () => ({
    recentRepositories: [],
  }),
  actions: {
    async loadRepositories() {
      this.recentRepositories = await window.repositoryAPI.getRepositories();
    },
    async addRepository(path) {
      this.recentRepositories = await window.repositoryAPI.addRepository(path);
    },
    async removeRepository(path) {
      this.recentRepositories = await window.repositoryAPI.removeRepository(path);
    },
  },
});
