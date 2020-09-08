
function dfExt_sortModulesTab() {
	'use strict';
	let modules = document.getElementById('module-list');
	var items = modules.childNodes;
	var itemsArr = [];
	for (var i in items) {
		// get rid of the whitespace text nodes
		if (items[i].nodeType != 1) continue;
		itemsArr.push(items[i]);
	}
	let compare = function (a, b) {
		return a > b ? 1 : a == b ? 0 : -1;
	};
	itemsArr.sort((a, b) => compare(a.firstElementChild.firstElementChild.innerHTML.trim(),
		b.firstElementChild.firstElementChild.innerHTML.trim()));
	for (i = 0; i < itemsArr.length; ++i) {
		modules.appendChild(itemsArr[i]);
	}
	modules.classList.add('df-ext-sorted');
}
function dfExt_sortPackages() {
	'use strict';
	let packages = document.querySelector('div#install-package ul.package-list');
	var items = packages.childNodes;
	var itemsArr = [];
	for (var i in items) {
		// get rid of the whitespace text nodes
		if (items[i].nodeType != 1) continue;
		itemsArr.push(items[i]);
	}
	let compare = function (a, b) {
		return a > b ? 1 : a == b ? 0 : -1;
	};
	itemsArr.sort((a, b) => compare(a.firstElementChild.firstElementChild.firstElementChild.innerHTML.trim(),
		b.firstElementChild.firstElementChild.firstElementChild.innerHTML.trim()));
	for (i = 0; i < itemsArr.length; ++i) {
		packages.appendChild(itemsArr[i]);
	}
	packages.classList.add('df-ext-sorted');
}

function dfExt_sortPoll() {
	let modules = document.getElementById('module-list');
	if (modules && !modules.classList.contains('df-ext-sorted'))
		dfExt_sortModulesTab();
	let packages = document.querySelector('div#install-package ul.package-list');
	if (packages && !packages.classList.contains('df-ext-sorted'))
		dfExt_sortPackages()
	setTimeout(dfExt_sortPoll, 100);
}
setTimeout(dfExt_sortPoll, 1000);
