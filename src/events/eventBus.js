import { EventEmitter } from 'events';

/**
 * Simple application-wide event bus.
 * Used to decouple domain services from transport layers like Socket.IO.
 */
class EventBus extends EventEmitter {}

export const eventBus = new EventBus()

// Allow a reasonable number of listeners without warnings
eventBus.setMaxListeners(50)

