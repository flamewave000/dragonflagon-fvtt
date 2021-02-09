import initDFChatArchive from "./archive/df-chat-archive.js";
import initDFChatPrivacy from "./privacy/df-chat-privacy.js";

(Application.prototype as any)._recalculateDimensions = function () {
	this.element[0].style.height = '';
	this.element[0].style.width = '';
	this.setPosition({});
}

Hooks.once('init', function() {
	initDFChatArchive();
	initDFChatPrivacy();
});