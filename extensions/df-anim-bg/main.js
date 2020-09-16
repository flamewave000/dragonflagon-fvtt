
(async function () {
	'use strict';
	let checkVideo = (url) => new Promise((res, _) => {
		let http = new XMLHttpRequest();
		http.open('HEAD', url);
		http.onload = (a) => res(a.target.status == 200);
		http.onerror = () => res(false);
		http.ontimeout = () => res(false);
		http.send();
	});
	const FIT_TYPES = ['cover', 'fill', 'contain', 'scale-down', 'none'];
	const body = document.getElementsByTagName('body')[0];
	const bgImg = body.style.backgroundImage;
	const reg = /url\( *['"]([\w\W]+?)['"] *\)/;
	let url = reg.exec(bgImg)[1];
	if (url === undefined) return;
	url = url.split('.');
	let end = url.pop().split('?')[1];
	let fit = 'cover';
	if (end !== undefined && FIT_TYPES.includes(end.toLowerCase())) fit = end.toLowerCase();
	url = url.join('.');
	let hasMp4 = await checkVideo(url + '.mp4');
	let hasM4v = await checkVideo(url + '.m4v');
	console.log(`DF-ANIM-BG: hasMp4:${hasMp4} hasM4v:${hasM4v}`);
	console.log(`DF-ANIM-BG: mp4:${url}.mp4`);
	console.log(`DF-ANIM-BG: m4v:${url}.m4v`);
	if (!hasMp4 && !hasM4v) return;
	let video = document.createElement('video');
	video.id = 'df-bg-video';
	video.className = 'df-anim-bg-video-element';
	video.setAttribute('loop', true);
	video.setAttribute('autoplay', true);
	video.style.objectFit = fit;
	if (hasMp4) {
		let mp4 = document.createElement('source');
		mp4.setAttribute('src', url + '.mp4');
		mp4.setAttribute('type', 'video/mp4');
		video.appendChild(mp4);
	}
	if (hasM4v) {
		let m4v = document.createElement('source');
		m4v.setAttribute('src', url + '.m4v');
		m4v.setAttribute('type', 'video/x-m4v');
		video.appendChild(m4v);
	}
	body.prepend(video);
})();