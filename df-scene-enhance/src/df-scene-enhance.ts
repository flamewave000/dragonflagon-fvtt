import DFSceneJournal from './df-scene-journal.js';
import DFSceneNav from './df-scene-nav.js';
import DFSceneThumb from './df-scene-thumb.js';

Hooks.once('init', function() {
	DFSceneJournal.init();
	DFSceneNav.init();
	DFSceneThumb.init();
});
Hooks.once('ready', function() {
	DFSceneJournal.ready();
	DFSceneNav.ready();
	DFSceneThumb.ready();
});