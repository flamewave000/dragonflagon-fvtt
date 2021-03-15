
interface Key {
	key: string;
	label: string;
}
interface KeyList {
	[key: string]: Key
}
export class Keys {
	private static _data: KeyList = {
		KeyA: { key: 'KeyA', label: 'Key A' },
		KeyB: { key: 'KeyB', label: 'Key B' },
		KeyC: { key: 'KeyC', label: 'Key C' },
		KeyD: { key: 'KeyD', label: 'Key D' },
		KeyE: { key: 'KeyE', label: 'Key E' },
		KeyF: { key: 'KeyF', label: 'Key F' },
		KeyG: { key: 'KeyG', label: 'Key G' },
		KeyH: { key: 'KeyH', label: 'Key H' },
		KeyI: { key: 'KeyI', label: 'Key I' },
		KeyJ: { key: 'KeyJ', label: 'Key J' },
		KeyK: { key: 'KeyK', label: 'Key K' },
		KeyL: { key: 'KeyL', label: 'Key L' },
		KeyM: { key: 'KeyM', label: 'Key M' },
		KeyN: { key: 'KeyN', label: 'Key N' },
		KeyO: { key: 'KeyO', label: 'Key O' },
		KeyP: { key: 'KeyP', label: 'Key P' },
		KeyQ: { key: 'KeyQ', label: 'Key Q' },
		KeyR: { key: 'KeyR', label: 'Key R' },
		KeyS: { key: 'KeyS', label: 'Key S' },
		KeyT: { key: 'KeyT', label: 'Key T' },
		KeyU: { key: 'KeyU', label: 'Key U' },
		KeyV: { key: 'KeyV', label: 'Key V' },
		KeyW: { key: 'KeyW', label: 'Key W' },
		KeyX: { key: 'KeyX', label: 'Key X' },
		KeyY: { key: 'KeyY', label: 'Key Y' },
		KeyZ: { key: 'KeyZ', label: 'Key Z' },
		Digit1: { key: 'Digit1', label: 'Digit 1' },
		Digit2: { key: 'Digit2', label: 'Digit 2' },
		Digit3: { key: 'Digit3', label: 'Digit 3' },
		Digit4: { key: 'Digit4', label: 'Digit 4' },
		Digit5: { key: 'Digit5', label: 'Digit 5' },
		Digit6: { key: 'Digit6', label: 'Digit 6' },
		Digit7: { key: 'Digit7', label: 'Digit 7' },
		Digit8: { key: 'Digit8', label: 'Digit 8' },
		Digit9: { key: 'Digit9', label: 'Digit 9' },
		Digit0: { key: 'Digit0', label: 'Digit 0' },
		Numpad1: { key: 'Numpad1', label: 'Numpad 1' },
		Numpad2: { key: 'Numpad2', label: 'Numpad 2' },
		Numpad3: { key: 'Numpad3', label: 'Numpad 3' },
		Numpad4: { key: 'Numpad4', label: 'Numpad 4' },
		Numpad5: { key: 'Numpad5', label: 'Numpad 5' },
		Numpad6: { key: 'Numpad6', label: 'Numpad 6' },
		Numpad7: { key: 'Numpad7', label: 'Numpad 7' },
		Numpad8: { key: 'Numpad8', label: 'Numpad 8' },
		Numpad9: { key: 'Numpad9', label: 'Numpad 9' },
		Numpad0: { key: 'Numpad0', label: 'Numpad 0' },
		BracketLeft: { key: 'BracketLeft', label: '[ Left Bracket' },
		BracketRight: { key: 'BracketRight', label: '] Right Bracket' },
		Slash: { key: 'Slash', label: '/ Forward Slash' },
		Backslash: { key: 'Backslash', label: '\\ Back Slash' },
		Minus: { key: 'Minus', label: '- Minus' },
		Equal: { key: 'Equal', label: '= Equal' },
		Semicolon: { key: 'Semicolon', label: '; Semicolon' },
		Quote: { key: 'Quote', label: '\' Quote' },
		Comma: { key: 'Comma', label: ', Comma' },
		Period: { key: 'Period', label: '. Period' },
		Backquote: { key: 'Backquote', label: '` Backquote' }
	};
	static get(key: string): Key { return this._data[key]; }
	static get keys(): string[] { return Object.values(this._data).map(x => x.key); }
	static get labels(): string[] { return Object.values(this._data).map(x => x.label); }
	static get entries(): Key[] { return Object.values(this._data); }
	static get KeyA() { return this._data.KeyA.key; }
	static get KeyB() { return this._data.KeyB.key; }
	static get KeyC() { return this._data.KeyC.key; }
	static get KeyD() { return this._data.KeyD.key; }
	static get KeyE() { return this._data.KeyE.key; }
	static get KeyF() { return this._data.KeyF.key; }
	static get KeyG() { return this._data.KeyG.key; }
	static get KeyH() { return this._data.KeyH.key; }
	static get KeyI() { return this._data.KeyI.key; }
	static get KeyJ() { return this._data.KeyJ.key; }
	static get KeyK() { return this._data.KeyK.key; }
	static get KeyL() { return this._data.KeyL.key; }
	static get KeyM() { return this._data.KeyM.key; }
	static get KeyN() { return this._data.KeyN.key; }
	static get KeyO() { return this._data.KeyO.key; }
	static get KeyP() { return this._data.KeyP.key; }
	static get KeyQ() { return this._data.KeyQ.key; }
	static get KeyR() { return this._data.KeyR.key; }
	static get KeyS() { return this._data.KeyS.key; }
	static get KeyT() { return this._data.KeyT.key; }
	static get KeyU() { return this._data.KeyU.key; }
	static get KeyV() { return this._data.KeyV.key; }
	static get KeyW() { return this._data.KeyW.key; }
	static get KeyX() { return this._data.KeyX.key; }
	static get KeyY() { return this._data.KeyY.key; }
	static get KeyZ() { return this._data.KeyZ.key; }
	static get Digit1() { return this._data.Digit1.key; }
	static get Digit2() { return this._data.Digit2.key; }
	static get Digit3() { return this._data.Digit3.key; }
	static get Digit4() { return this._data.Digit4.key; }
	static get Digit5() { return this._data.Digit5.key; }
	static get Digit6() { return this._data.Digit6.key; }
	static get Digit7() { return this._data.Digit7.key; }
	static get Digit8() { return this._data.Digit8.key; }
	static get Digit9() { return this._data.Digit9.key; }
	static get Digit0() { return this._data.Digit0.key; }
	static get Numpad1() { return this._data.Numpad1.key; }
	static get Numpad2() { return this._data.Numpad2.key; }
	static get Numpad3() { return this._data.Numpad3.key; }
	static get Numpad4() { return this._data.Numpad4.key; }
	static get Numpad5() { return this._data.Numpad5.key; }
	static get Numpad6() { return this._data.Numpad6.key; }
	static get Numpad7() { return this._data.Numpad7.key; }
	static get Numpad8() { return this._data.Numpad8.key; }
	static get Numpad9() { return this._data.Numpad9.key; }
	static get Numpad0() { return this._data.Numpad0.key; }
	static get BracketLeft() { return this._data.BracketLeft.key; }
	static get BracketRight() { return this._data.BracketRight.key; }
	static get Slash() { return this._data.Slash.key; }
	static get Backslash() { return this._data.Backslash.key; }
	static get Minus() { return this._data.Minus.key; }
	static get Equal() { return this._data.Equal.key; }
	static get Semicolon() { return this._data.Semicolon.key; }
	static get Quote() { return this._data.Quote.key; }
	static get Comma() { return this._data.Comma.key; }
	static get Period() { return this._data.Period.key; }
	static get Backquote() { return this._data.Backquote.key; }
};
