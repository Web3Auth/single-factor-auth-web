import { IStorage } from "@web3auth/auth";

import { IAsyncStorage } from "./interface";

export class AsyncStorage {
  public storage: IAsyncStorage | IStorage;

  private _storeKey: string;

  constructor(storeKey: string, storage: IAsyncStorage | IStorage) {
    this.storage = storage;
    this._storeKey = storeKey;
  }

  async toJSON(): Promise<string> {
    const result = await this.storage.getItem(this._storeKey);
    return result;
  }

  async resetStore(): Promise<Record<string, unknown>> {
    const currStore = await this.getStore();
    await this.storage.setItem(this._storeKey, JSON.stringify({}));
    return currStore;
  }

  async getStore(): Promise<Record<string, unknown>> {
    return JSON.parse((await this.storage.getItem(this._storeKey)) || "{}");
  }

  async get<T>(key: string): Promise<T> {
    const store = JSON.parse((await this.storage.getItem(this._storeKey)) || "{}");
    return store[key];
  }

  async set<T>(key: string, value: T): Promise<void> {
    const store = JSON.parse((await this.storage.getItem(this._storeKey)) || "{}");
    store[key] = value;
    await this.storage.setItem(this._storeKey, JSON.stringify(store));
  }

  async remove(key: string): Promise<void> {
    const store = JSON.parse((await this.storage.getItem(this._storeKey)) || "{}");
    delete store[key];
    await this.storage.setItem(this._storeKey, JSON.stringify(store));
  }
}
