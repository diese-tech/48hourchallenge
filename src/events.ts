import Phaser from 'phaser';

// Global event bus — all cross-entity communication goes through here
const EventBus = new Phaser.Events.EventEmitter();
export default EventBus;
