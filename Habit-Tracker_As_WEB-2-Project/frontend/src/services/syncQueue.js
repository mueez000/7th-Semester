import { get, set } from 'idb-keyval';
import api from './api';

const SYNC_QUEUE_KEY = 'offline-sync-queue';

export const addToSyncQueue = async (requestConfig) => {
  try {
    const queue = await get(SYNC_QUEUE_KEY) || [];
    queue.push(requestConfig);
    await set(SYNC_QUEUE_KEY, queue);
    console.log('Request queued for background sync:', requestConfig);
  } catch (error) {
    console.error('Failed to add to sync queue', error);
  }
};

export const processSyncQueue = async () => {
  if (!navigator.onLine) return;

  try {
    const queue = await get(SYNC_QUEUE_KEY) || [];
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} queued background requests...`);
    
    // We process sequentially to maintain order
    const failedQueue = [];
    
    for (const req of queue) {
      try {
        await api({
          method: req.method,
          url: req.url,
          data: req.data,
          // Don't re-queue if it fails again during sync, we will handle that
          headers: { 'X-From-Sync-Queue': 'true' }
        });
        console.log('Successfully synced:', req.url);
      } catch (error) {
        console.error('Failed to sync request:', req, error);
        // If it's a 4xx error (e.g. bad request), we probably shouldn't retry it forever.
        // If it's a network error (5xx or offline), keep it in queue.
        if (!error.response || error.response.status >= 500) {
          failedQueue.push(req);
        }
      }
    }

    await set(SYNC_QUEUE_KEY, failedQueue);
    
    if (failedQueue.length === 0) {
      console.log('Sync queue processing complete.');
    } else {
      console.log(`${failedQueue.length} items failed to sync and remain in queue.`);
    }
  } catch (error) {
    console.error('Error processing sync queue:', error);
  }
};

// Listen for online events to automatically process the queue
if (typeof window !== 'undefined') {
  window.addEventListener('online', processSyncQueue);
}
