import seedData from './db.json';
import { storageEngine } from './storageEngine';

class DBClient {
  constructor() {
    this.data = null;
    this.subscribers = new Set();
  }

  // Subscribes to changes to re-render UI when DB is directly mutated (simulating reactive DB/WebSockets)
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach(cb => cb());
  }

  initialize() {
    const existing = storageEngine.get();
    if (existing) {
      this.data = existing;
    } else {
      this.data = JSON.parse(JSON.stringify(seedData));
      storageEngine.set(this.data);
    }
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(seedData));
    storageEngine.set(this.data);
    this.notify();
  }

  _save() {
    storageEngine.set(this.data);
    this.notify();
  }

  // Generic methods
  getCollection(collectionName) {
    if (!this.data) this.initialize();
    return this.data[collectionName] || [];
  }

  getById(collectionName, id) {
    const collection = this.getCollection(collectionName);
    return collection.find(item => item.id === id);
  }

  insert(collectionName, item) {
    if (!this.data) this.initialize();
    const newItem = { 
      ...item, 
      id: item.id || `${collectionName.charAt(0)}${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!this.data[collectionName]) this.data[collectionName] = [];
    this.data[collectionName].push(newItem);
    this._save();
    return newItem;
  }

  update(collectionName, id, updates) {
    if (!this.data) this.initialize();
    const collection = this.data[collectionName] || [];
    const index = collection.findIndex(item => item.id === id);
    if (index !== -1) {
      const updatedItem = { ...collection[index], ...updates, updatedAt: new Date().toISOString() };
      this.data[collectionName][index] = updatedItem;
      this._save();
      return updatedItem;
    }
    return null;
  }

  delete(collectionName, id) {
    if (!this.data) this.initialize();
    if (!this.data[collectionName]) return false;
    const initialLength = this.data[collectionName].length;
    this.data[collectionName] = this.data[collectionName].filter(item => item.id !== id);
    
    if (this.data[collectionName].length !== initialLength) {
      this._save();
      return true;
    }
    return false;
  }
}

export const db = new DBClient();
