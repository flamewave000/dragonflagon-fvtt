
(function() {
    'use strict';
	const FIT_TYPES = ['cover', 'fill', 'contain', 'scale-down', 'none'];
	const body = document.getElementsByTagName('body')[0];
    const bgImg = body.style.backgroundImage;
    const reg = /url\( *['"]([\w\W]+?)['"] *\)/;
    let url = reg.exec(bgImg)[1];
    if (url === undefined) return;
    url = url.split('.');
    let end = url.pop().split('?')[1];
    let fit = 'cover';
    if (end !== undefined && FIT_TYPES.includes(end.toLowerCase()))
        fit = end.toLowerCase();
	url = url.join('.');
	let video = document.createElement('video');
	video.id = 'df-bg-video';
	video.className = 'df-anim-bg-video-element';
	video.setAttribute('controls', false);
	video.setAttribute('loop', true);
	video.setAttribute('autoplay', true);
	video.style.objectFit = fit;
	let mp4 = document.createElement('source');
	mp4.setAttribute('src', url + '.mp4');
	mp4.setAttribute('type', 'video/mp4');
	let m4v = document.createElement('source');
	m4v.setAttribute('src', url + '.m4v');
	m4v.setAttribute('type', 'video/x-m4v');
	video.appendChild(mp4);
	video.appendChild(m4v);
	body.prepend(video);
})();